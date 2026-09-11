import { describe, it, expect, beforeEach } from 'vitest';
// @ts-expect-error Node ES module without ambient types
import { db } from '../../server/index.mjs';

describe('NEURO//NODE Multi-Device Sync Server & Protocol', () => {
  const devA = {
    deviceId: 'dev_laptop_test_01',
    deviceName: 'Workstation ThinkPad',
    shortId: 'TP-101',
  };

  const devB = {
    deviceId: 'dev_mobile_test_02',
    deviceName: 'Pixel 8 Pro',
    shortId: 'P8-202',
  };

  beforeEach(() => {
    db.devices.clear();
    db.pairingCodes.clear();
    db.syncGroups.clear();
    // Register test devices
    db.registerDevice(devA.deviceId, devA.deviceName, devA.shortId);
    db.registerDevice(devB.deviceId, devB.deviceName, devB.shortId);
  });

  it('registers devices and generates authentication tokens', () => {
    const reg = db.getDevice(devA.deviceId);
    expect(reg).toBeDefined();
    expect(reg?.deviceId).toBe(devA.deviceId);
    expect(reg?.authToken).toMatch(/^tok_/);
  });

  it('generates a 6-character formatted pair code with 5-minute validity', () => {
    const regA = db.getDevice(devA.deviceId)!;
    const pairInfo = db.createPairCode(regA);

    expect(pairInfo.code).toBeDefined();
    // Pattern XX-XX-XX
    expect(pairInfo.code).toMatch(/^[2-9A-Z]{2}-[2-9A-Z]{2}-[2-9A-Z]{2}$/);
    expect(pairInfo.expiresAt).toBeGreaterThan(Date.now() + 4 * 60 * 1000);
    expect(pairInfo.codeHash).toBeDefined();

    // Verify lookup by raw code
    const record = db.findPairCode(pairInfo.code);
    expect(record).toBeDefined();
    expect(record?.deviceId).toBe(devA.deviceId);
  });

  it('manages interactive pair request, approval, and sync group creation', () => {
    const regA = db.getDevice(devA.deviceId)!;
    const regB = db.getDevice(devB.deviceId)!;

    // Device A generates code
    const pairInfo = db.createPairCode(regA);

    // Device B requests to pair with code
    const record = db.findPairCode(pairInfo.code)!;
    record.status = 'WAITING_CONFIRMATION';
    record.requesterDevice = {
      requestId: 'req_test_001',
      deviceId: regB.deviceId,
      deviceName: regB.deviceName,
      shortId: regB.shortId,
      timestamp: Date.now(),
    };

    // Device A approves
    const group = db.createOrJoinSyncGroup(regA.deviceId, regB.deviceId)!;
    expect(group).toBeDefined();
    expect(group.syncGroupId).toMatch(/^pair_/);
    expect(group.memberDeviceIds).toContain(regA.deviceId);
    expect(group.memberDeviceIds).toContain(regB.deviceId);

    // Both devices share the same syncGroupId
    expect(db.getDevice(regA.deviceId)?.syncGroupId).toBe(group.syncGroupId);
    expect(db.getDevice(regB.deviceId)?.syncGroupId).toBe(group.syncGroupId);
  });

  it('supports monotonic revision numbering and operation push/pull', () => {
    const regA = db.getDevice(devA.deviceId)!;
    const regB = db.getDevice(devB.deviceId)!;
    const group = db.createOrJoinSyncGroup(regA.deviceId, regB.deviceId)!;

    const op1 = {
      operationId: 'op_test_1001',
      deviceId: regA.deviceId,
      entityId: 'bm_1',
      type: 'BOOKMARK_ADD',
      timestamp: Date.now(),
      payload: { url: 'https://example.com' },
    };

    const op2 = {
      operationId: 'op_test_1002',
      deviceId: regA.deviceId,
      entityId: 'bm_2',
      type: 'BOOKMARK_ADD',
      timestamp: Date.now(),
      payload: { url: 'https://github.com' },
    };

    // Push operations
    const pushResult = db.pushOperations(group.syncGroupId, regA.deviceId, [op1, op2])!;
    expect(pushResult).toBeDefined();
    expect(pushResult.serverRevision).toBe(2);
    expect(pushResult.acknowledgedIds).toEqual(['op_test_1001', 'op_test_1002']);

    // Device B pulls since revision 0
    const pullAll = db.pullOperations(group.syncGroupId, 0);
    expect(pullAll.operations.length).toBe(2);
    expect(pullAll.currentRevision).toBe(2);

    // Device B pulls incrementally since revision 1
    const pullInc = db.pullOperations(group.syncGroupId, 1);
    expect(pullInc.operations.length).toBe(1);
    expect(pullInc.operations[0].operation.operationId).toBe('op_test_1002');
  });

  it('maintains idempotency and rejects duplicate operations', () => {
    const regA = db.getDevice(devA.deviceId)!;
    const group = db.createOrJoinSyncGroup(regA.deviceId, devB.deviceId)!;

    const op = {
      operationId: 'op_idempotency_1',
      deviceId: regA.deviceId,
      entityId: 'bm_idem',
      type: 'BOOKMARK_ADD',
      timestamp: Date.now(),
      payload: { url: 'https://idempotent.com' },
    };

    // First push
    const res1 = db.pushOperations(group.syncGroupId, regA.deviceId, [op])!;
    const initialRev = res1.serverRevision;

    // Second push of identical operationId
    const res2 = db.pushOperations(group.syncGroupId, regA.deviceId, [op])!;
    // Revision should not increment
    expect(res2.serverRevision).toBe(initialRev);
    // Operation is still acknowledged
    expect(res2.acknowledgedIds).toContain('op_idempotency_1');
    expect(res2.newRevisions.length).toBe(0);
  });

  it('unpairs devices and isolates sync state cleanly', () => {
    const regA = db.getDevice(devA.deviceId)!;
    const group = db.createOrJoinSyncGroup(regA.deviceId, devB.deviceId)!;

    expect(db.getDevice(regA.deviceId)?.syncGroupId).toBe(group.syncGroupId);

    // Unpair Device A
    const success = db.unpairDevice(regA.deviceId);
    expect(success).toBe(true);
    expect(db.getDevice(regA.deviceId)?.syncGroupId).toBeNull();
  });
});
