import { vi } from 'vitest';
import { RotaService } from '../rota.service';
import { StaffRepository } from '../../repositories/staff.repository';
import { ConfigRepository } from '../../repositories/config.repository';
import { OverrideRepository } from '../../repositories/override.repository';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { ShiftRepository } from '../../repositories/shift.repository';
import { AllocationRepository } from '../../repositories/allocation.repository';
import { StaffContractedHoursRepository } from '../../repositories/staff-contracted-hours.repository';
import { AbsenceRepository } from '../../repositories/absence.repository';
import type { StaffMember } from '../../../shared/types/staff';

// Mock the repositories
vi.mock('../../repositories/staff.repository');
vi.mock('../../repositories/config.repository');
vi.mock('../../repositories/override.repository');
vi.mock('../../repositories/schedule.repository');
vi.mock('../../repositories/shift.repository');
vi.mock('../../repositories/allocation.repository');
vi.mock('../../repositories/staff-contracted-hours.repository');
vi.mock('../../repositories/absence.repository');

// Don't mock the specialized services - let them run with real logic
// They will use the mocked repositories

describe('RotaService', () => {
  let rotaService: RotaService;
  let mockStaffRepo: any;
  let mockConfigRepo: any;
  let mockOverrideRepo: any;
  let mockScheduleRepo: any;
  let mockShiftRepo: any;
  let mockAllocationRepo: any;
  let mockContractedHoursRepo: any;
  let mockAbsenceRepo: any;
  let mockManualAssignmentService: any;

  const APP_ZERO_DATE = '2025-10-26'; // Sunday (updated from 2024-01-01 on 2025-10-30)

  // Helper: Build date string by adding days to zero date (no string concatenation!)
  const getDateAtPhase = (phase: number): string => {
    const date = new Date(APP_ZERO_DATE + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + phase);
    return date.toISOString().split('T')[0];
  };

  // Helper: Create mock staff with defaults
  const createMockStaff = (overrides: Partial<StaffMember> = {}): StaffMember => ({
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    status: 'Regular',
    group: 'Day',
    cycleType: '4-on-4-off',
    daysOffset: 0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  // Helper: Setup single staff member for testing
  const setupStaff = (overrides: Partial<StaffMember> = {}) => {
    // Setup mock shifts based on staff type
    let shiftId = null;
    const mockShifts = [];

    if (overrides.group === 'Day') {
      shiftId = 1;
      mockShifts.push({
        id: 1,
        name: 'Day Shift A',
        cycleType: '4-on-4-off',
        daysOffset: overrides.daysOffset || 0,
        group: 'Day',
        isActive: true,
      });
    } else if (overrides.group === 'Night') {
      shiftId = 2;
      mockShifts.push({
        id: 2,
        name: 'Night Shift A',
        cycleType: '4-on-4-off',
        daysOffset: overrides.daysOffset || 0,
        group: 'Night',
        isActive: true,
      });
    } else if (overrides.cycleType === 'supervisor' || overrides.cycleType === '16-day-supervisor') {
      shiftId = 3;
      mockShifts.push({
        id: 3,
        name: 'Supervisor Shift',
        cycleType: '16-day-supervisor',
        daysOffset: overrides.daysOffset || 0,
        group: null,
        isActive: true,
      });
    }

    const staff = createMockStaff({ ...overrides, shiftId });
    mockStaffRepo.findAll.mockResolvedValue([staff]);
    mockStaffRepo.findByShiftIds.mockResolvedValue([{ ...staff, shift: mockShifts[0] || null }]);
    mockShiftRepo.findAll.mockResolvedValue(mockShifts);

    return staff;
  };

  beforeEach(() => {
    rotaService = new RotaService();
    mockStaffRepo = (rotaService as any).staffRepo;
    mockConfigRepo = (rotaService as any).configRepo;
    mockScheduleRepo = (rotaService as any).scheduleRepo;
    mockShiftRepo = (rotaService as any).shiftRepo;
    mockAllocationRepo = (rotaService as any).allocationRepo;
    mockContractedHoursRepo = (rotaService as any).shiftTimeService?.contractedHoursRepo;
    mockAbsenceRepo = (rotaService as any).absenceRepo;
    mockManualAssignmentService = (rotaService as any).manualAssignmentService;

    // Default mocks - ensure all methods exist
    mockConfigRepo.getByKey = vi.fn().mockResolvedValue(APP_ZERO_DATE);

    mockScheduleRepo.findByStaffIdAndDate = vi.fn().mockResolvedValue(null);
    mockScheduleRepo.findByDate = vi.fn().mockResolvedValue([]);

    mockShiftRepo.findAll = vi.fn().mockResolvedValue([]);
    mockShiftRepo.findById = vi.fn().mockResolvedValue(null);

    mockStaffRepo.findAll = vi.fn().mockResolvedValue([]);
    mockStaffRepo.findByShiftIds = vi.fn().mockResolvedValue([]);
    mockStaffRepo.findById = vi.fn().mockResolvedValue(null);

    mockAllocationRepo.findByStaffId = vi.fn().mockResolvedValue([]);
    mockAllocationRepo.findAll = vi.fn().mockResolvedValue([]);
    mockAllocationRepo.findByArea = vi.fn().mockResolvedValue([]);

    if (mockContractedHoursRepo) {
      mockContractedHoursRepo.findByStaff = vi.fn().mockResolvedValue([]);
      mockContractedHoursRepo.findByStaffIds = vi.fn().mockResolvedValue([]);
      mockContractedHoursRepo.findAll = vi.fn().mockResolvedValue([]);
    }

    mockAbsenceRepo.findByStaffId = vi.fn().mockResolvedValue([]);
    mockAbsenceRepo.findByStaffIds = vi.fn().mockResolvedValue(new Map());
    mockAbsenceRepo.findAbsenceForDate = vi.fn().mockResolvedValue(null);
    mockAbsenceRepo.findAbsencesForDate = vi.fn().mockResolvedValue(new Map());

    // The specialized services will use real logic with mocked repositories
    // No need to mock them - they'll work correctly with the repository mocks
  });

  describe('Regular Staff - 4-on-4-off Cycle State', () => {
    it('should follow 8-day cycle pattern (golden table)', async () => {
      setupStaff({ group: 'Day', daysOffset: 0 });

      // Golden table: phase -> expected state
      const pattern = [
        { phase: 0, onDuty: true },
        { phase: 1, onDuty: true },
        { phase: 2, onDuty: true },
        { phase: 3, onDuty: true },
        { phase: 4, onDuty: false },
        { phase: 5, onDuty: false },
        { phase: 6, onDuty: false },
        { phase: 7, onDuty: false },
      ];

      for (const { phase, onDuty } of pattern) {
        const rota = await rotaService.getRotaForDate(getDateAtPhase(phase));
        expect(rota.dayShifts).toHaveLength(onDuty ? 1 : 0);
      }
    });

    it('should repeat pattern after 8 days', async () => {
      setupStaff({ group: 'Day', daysOffset: 0 });

      const phase0 = await rotaService.getRotaForDate(getDateAtPhase(0));
      const phase8 = await rotaService.getRotaForDate(getDateAtPhase(8));
      const phase16 = await rotaService.getRotaForDate(getDateAtPhase(16));

      expect(phase0.dayShifts).toHaveLength(1);
      expect(phase8.dayShifts).toHaveLength(1);
      expect(phase16.dayShifts).toHaveLength(1);
    });

    it('should handle positive offset (shifts cycle forward)', async () => {
      setupStaff({ group: 'Day', daysOffset: 4 });

      // Offset 4 means: phase 0 -> cycle position -4 (wraps to 4) -> OFF
      const phase0 = await rotaService.getRotaForDate(getDateAtPhase(0));
      expect(phase0.dayShifts).toHaveLength(0);

      // Phase 4 -> cycle position 0 -> ON
      const phase4 = await rotaService.getRotaForDate(getDateAtPhase(4));
      expect(phase4.dayShifts).toHaveLength(1);
    });

    it('should handle negative offset (shifts cycle backward)', async () => {
      setupStaff({ group: 'Day', daysOffset: -2 });

      // Offset -2 means: phase 0 -> cycle position 2 -> ON
      const phase0 = await rotaService.getRotaForDate(getDateAtPhase(0));
      expect(phase0.dayShifts).toHaveLength(1);
    });

    it('should assign Night group to night shifts', async () => {
      setupStaff({ group: 'Night', daysOffset: 0 });

      const rota = await rotaService.getRotaForDate(getDateAtPhase(0));
      expect(rota.nightShifts).toHaveLength(1);
      expect(rota.dayShifts).toHaveLength(0);
    });
  });

  describe('Supervisor - Cycle State (Pure Logic, No Overlaps)', () => {
    it('should follow 16-day cycle pattern (golden table)', async () => {
      const staff = setupStaff({ status: 'Supervisor', group: null, cycleType: 'supervisor', daysOffset: 8 });
      const appZeroDate = APP_ZERO_DATE;

      // Golden table: Supervisor 16-day wheel (CYCLE STATE ONLY - tests isStaffOnDuty directly)
      // 0-3: DAY | 4-7: OFF | 8-11: NIGHT | 12-15: OFF
      const goldenPattern = [
        // Days 0-3: DAY shift
        { phase: 0, onDuty: true, shiftType: 'day' },
        { phase: 1, onDuty: true, shiftType: 'day' },
        { phase: 2, onDuty: true, shiftType: 'day' },
        { phase: 3, onDuty: true, shiftType: 'day' },
        // Days 4-7: OFF
        { phase: 4, onDuty: false, shiftType: null },
        { phase: 5, onDuty: false, shiftType: null },
        { phase: 6, onDuty: false, shiftType: null },
        { phase: 7, onDuty: false, shiftType: null },
        // Days 8-11: NIGHT shift
        { phase: 8, onDuty: true, shiftType: 'night' },
        { phase: 9, onDuty: true, shiftType: 'night' },
        { phase: 10, onDuty: true, shiftType: 'night' },
        { phase: 11, onDuty: true, shiftType: 'night' },
        // Days 12-15: OFF
        { phase: 12, onDuty: false, shiftType: null },
        { phase: 13, onDuty: false, shiftType: null },
        { phase: 14, onDuty: false, shiftType: null },
        { phase: 15, onDuty: false, shiftType: null },
      ];

      for (const { phase, onDuty, shiftType } of goldenPattern) {
        const result = rotaService.isStaffOnDuty(staff, getDateAtPhase(phase), appZeroDate);
        expect(result.onDuty).toBe(onDuty);
        expect(result.shiftType).toBe(shiftType);
      }
    });

    it('should repeat pattern after 16 days', async () => {
      const staff = setupStaff({ status: 'Supervisor', group: null, cycleType: 'supervisor', daysOffset: 8 });
      const appZeroDate = APP_ZERO_DATE;

      const phase0 = rotaService.isStaffOnDuty(staff, getDateAtPhase(0), appZeroDate);
      const phase16 = rotaService.isStaffOnDuty(staff, getDateAtPhase(16), appZeroDate);
      const phase32 = rotaService.isStaffOnDuty(staff, getDateAtPhase(32), appZeroDate);

      expect(phase0.onDuty).toBe(true);
      expect(phase0.shiftType).toBe('day');
      expect(phase16.onDuty).toBe(true);
      expect(phase16.shiftType).toBe('day');
      expect(phase32.onDuty).toBe(true);
      expect(phase32.shiftType).toBe('day');
    });

    it('should handle offset correctly', async () => {
      const staff = setupStaff({ status: 'Supervisor', group: null, cycleType: 'supervisor', daysOffset: 12 });
      const appZeroDate = APP_ZERO_DATE;

      // Offset 12: phase 0 -> cycle position -12 (wraps to 4) -> OFF
      const phase0 = rotaService.isStaffOnDuty(staff, getDateAtPhase(0), appZeroDate);
      expect(phase0.onDuty).toBe(false);
      expect(phase0.shiftType).toBe(null);

      // Phase 12 -> cycle position 0 -> DAY
      const phase12 = rotaService.isStaffOnDuty(staff, getDateAtPhase(12), appZeroDate);
      expect(phase12.onDuty).toBe(true);
      expect(phase12.shiftType).toBe('day');
    });
  });

  describe('Supervisor - Day View (With Night Shift Overlaps)', () => {
    it('should show night shift overlap on phase 12 from phase 11', async () => {
      setupStaff({ status: 'Supervisor', group: null, cycleType: 'supervisor', daysOffset: 8 });

      // Phase 11: Last night shift day (cycle state = NIGHT)
      // Should show: today's shift + yesterday's overlap = 2 shifts
      const phase11 = await rotaService.getRotaForDate(getDateAtPhase(11));
      expect(phase11.nightShifts).toHaveLength(2);
      expect(phase11.nightShifts.some(s => s.assignmentDate === getDateAtPhase(11))).toBe(true); // Today's
      expect(phase11.nightShifts.some(s => s.assignmentDate === getDateAtPhase(10))).toBe(true); // Yesterday's overlap

      // Phase 12: OFF in cycle state, but shows overlap from phase 11
      const phase12 = await rotaService.getRotaForDate(getDateAtPhase(12));
      expect(phase12.dayShifts).toHaveLength(0);
      expect(phase12.nightShifts).toHaveLength(1); // Overlap only
      expect(phase12.nightShifts[0].assignmentDate).toBe(getDateAtPhase(11)); // Started yesterday

      // Phase 13-15: Completely off (no overlaps)
      for (let phase = 13; phase <= 15; phase++) {
        const rota = await rotaService.getRotaForDate(getDateAtPhase(phase));
        expect(rota.dayShifts).toHaveLength(0);
        expect(rota.nightShifts).toHaveLength(0);
      }
    });

    it('should show overlaps during night shift period (phases 8-11)', async () => {
      setupStaff({ status: 'Supervisor', group: null, cycleType: 'supervisor', daysOffset: 8 });

      // Phase 8: First night, no overlap from previous day (phase 7 is OFF)
      const phase8 = await rotaService.getRotaForDate(getDateAtPhase(8));
      expect(phase8.nightShifts).toHaveLength(1);
      expect(phase8.nightShifts[0].assignmentDate).toBe(getDateAtPhase(8));

      // Phase 9: Night shift + overlap from phase 8
      const phase9 = await rotaService.getRotaForDate(getDateAtPhase(9));
      expect(phase9.nightShifts).toHaveLength(2); // Today's + yesterday's
      expect(phase9.nightShifts.some(s => s.assignmentDate === getDateAtPhase(9))).toBe(true);
      expect(phase9.nightShifts.some(s => s.assignmentDate === getDateAtPhase(8))).toBe(true);

      // Phase 10: Night shift + overlap from phase 9
      const phase10 = await rotaService.getRotaForDate(getDateAtPhase(10));
      expect(phase10.nightShifts).toHaveLength(2);
      expect(phase10.nightShifts.some(s => s.assignmentDate === getDateAtPhase(10))).toBe(true);
      expect(phase10.nightShifts.some(s => s.assignmentDate === getDateAtPhase(9))).toBe(true);

      // Phase 11: Night shift + overlap from phase 10
      const phase11 = await rotaService.getRotaForDate(getDateAtPhase(11));
      expect(phase11.nightShifts).toHaveLength(2);
      expect(phase11.nightShifts.some(s => s.assignmentDate === getDateAtPhase(11))).toBe(true);
      expect(phase11.nightShifts.some(s => s.assignmentDate === getDateAtPhase(10))).toBe(true);
    });
  });

  describe('Night Shift Overlap - General Behavior', () => {
    it('should show regular night shift on both days it spans (20:00-08:00)', async () => {
      setupStaff({ group: 'Night', daysOffset: 0 });

      // Night group: phases 0-3 ON, 4-7 OFF
      // Phase 0: First night shift (no previous night shift)
      const phase0 = await rotaService.getRotaForDate(getDateAtPhase(0));
      expect(phase0.nightShifts).toHaveLength(1);
      expect(phase0.nightShifts[0].assignmentDate).toBe(getDateAtPhase(0));

      // Phase 1: Night shift + overlap from phase 0
      const phase1 = await rotaService.getRotaForDate(getDateAtPhase(1));
      expect(phase1.nightShifts).toHaveLength(2); // Today's + yesterday's overlap
      expect(phase1.nightShifts.some(s => s.assignmentDate === getDateAtPhase(1))).toBe(true);
      expect(phase1.nightShifts.some(s => s.assignmentDate === getDateAtPhase(0))).toBe(true);
    });

    it('should show overlap on first OFF day after night shifts', async () => {
      setupStaff({ group: 'Night', daysOffset: 0 });

      // Night group: phases 0-3 ON, 4-7 OFF
      // Phase 4 is OFF in cycle state, but shows overlap from phase 3
      const phase4 = await rotaService.getRotaForDate(getDateAtPhase(4));
      expect(phase4.nightShifts).toHaveLength(1); // Overlap from phase 3
      expect(phase4.nightShifts[0].assignmentDate).toBe(getDateAtPhase(3));

      // Phase 5: OFF, no overlap (phase 4 was OFF)
      const phase5 = await rotaService.getRotaForDate(getDateAtPhase(5));
      expect(phase5.nightShifts).toHaveLength(0);
    });
  });

  describe('Manual Assignments - Override Behavior', () => {
    it('should override calculated schedule with manual assignment', async () => {
      const staff = setupStaff({ group: 'Day', daysOffset: 0 });

      // Mock the override repository to return a manual assignment
      const mockOverrideRepo = (rotaService as any).manualAssignmentService.overrideRepo;
      mockOverrideRepo.findByDate = vi.fn().mockImplementation((date: string) => {
        if (date === getDateAtPhase(0)) {
          return Promise.resolve([{
            id: 1,
            staffId: 1,
            assignmentDate: getDateAtPhase(0),
            shiftType: 'Night',
            shiftStart: null,
            shiftEnd: null,
            notes: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }]);
        }
        return Promise.resolve([]);
      });

      const rota = await rotaService.getRotaForDate(getDateAtPhase(0));

      // Should show Night shift (manual) instead of Day shift (calculated)
      expect(rota.nightShifts).toHaveLength(1);
      expect(rota.nightShifts[0].isManualAssignment).toBe(true);
      expect(rota.dayShifts).toHaveLength(0);
    });

    it('should allow Relief staff to be manually assigned', async () => {
      const staff = setupStaff({ status: 'Relief', group: null, cycleType: null });

      // Mock the override repository to return a manual assignment
      const mockOverrideRepo = (rotaService as any).manualAssignmentService.overrideRepo;
      mockOverrideRepo.findByDate = vi.fn().mockImplementation((date: string) => {
        if (date === getDateAtPhase(0)) {
          return Promise.resolve([{
            id: 1,
            staffId: 1,
            assignmentDate: getDateAtPhase(0),
            shiftType: 'Day',
            shiftStart: null,
            shiftEnd: null,
            notes: 'Covering for sick leave',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }]);
        }
        return Promise.resolve([]);
      });

      const rota = await rotaService.getRotaForDate(getDateAtPhase(0));

      expect(rota.dayShifts).toHaveLength(1);
      expect(rota.dayShifts[0].staff.status).toBe('Relief');
      expect(rota.dayShifts[0].isManualAssignment).toBe(true);
    });
  });

  describe('Relief Staff - No Automatic Scheduling', () => {
    it('should not schedule Relief staff automatically', async () => {
      setupStaff({ status: 'Relief', group: null, cycleType: null });

      const rota = await rotaService.getRotaForDate(getDateAtPhase(0));

      expect(rota.dayShifts).toHaveLength(0);
      expect(rota.nightShifts).toHaveLength(0);
    });
  });
});

