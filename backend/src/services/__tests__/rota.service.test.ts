import { vi } from 'vitest';
import { RotaService } from '../rota.service';
import { StaffRepository } from '../../repositories/staff.repository';
import { ConfigRepository } from '../../repositories/config.repository';
import { OverrideRepository } from '../../repositories/override.repository';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import type { StaffMember } from '@shared/types/staff';

// Mock the repositories
vi.mock('../../repositories/staff.repository');
vi.mock('../../repositories/config.repository');
vi.mock('../../repositories/override.repository');
vi.mock('../../repositories/schedule.repository');

describe('RotaService', () => {
  let rotaService: RotaService;
  let mockStaffRepo: any;
  let mockConfigRepo: any;
  let mockOverrideRepo: any;
  let mockScheduleRepo: any;

  const appZeroDate = '2024-01-01'; // Monday

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

  beforeEach(() => {
    rotaService = new RotaService();
    mockStaffRepo = (rotaService as any).staffRepo;
    mockConfigRepo = (rotaService as any).configRepo;
    mockOverrideRepo = (rotaService as any).overrideRepo;
    mockScheduleRepo = (rotaService as any).scheduleRepo;

    // Default mocks
    mockConfigRepo.getByKey.mockResolvedValue(appZeroDate);
    mockOverrideRepo.findByDate.mockResolvedValue([]);
    mockScheduleRepo.findByStaffIdAndDate.mockResolvedValue(null);
  });

  describe('Regular Staff - 4-on-4-off Pattern', () => {
    it('should calculate Day shift for staff with 0 offset on day 0', async () => {
      const staff = createMockStaff({ id: 1, group: 'Day', daysOffset: 0 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      const rota = await rotaService.getRotaForDate('2024-01-01'); // Day 0

      expect(rota.dayShifts).toHaveLength(1);
      expect(rota.dayShifts[0].staff.id).toBe(1);
      expect(rota.nightShifts).toHaveLength(0);
    });

    it('should calculate Day shift for staff with 0 offset on days 0-3', async () => {
      const staff = createMockStaff({ id: 1, group: 'Day', daysOffset: 0 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // Days 0-3 should be on duty
      for (let day = 0; day < 4; day++) {
        const date = `2024-01-0${day + 1}`;
        const rota = await rotaService.getRotaForDate(date);
        expect(rota.dayShifts).toHaveLength(1);
      }
    });

    it('should not schedule staff on days 4-7 (off days)', async () => {
      const staff = createMockStaff({ id: 1, group: 'Day', daysOffset: 0 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // Days 4-7 should be off
      for (let day = 4; day < 8; day++) {
        const date = `2024-01-0${day + 1}`;
        const rota = await rotaService.getRotaForDate(date);
        expect(rota.dayShifts).toHaveLength(0);
      }
    });

    it('should handle positive offset correctly', async () => {
      const staff = createMockStaff({ id: 1, group: 'Day', daysOffset: 4 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // With offset 4, staff should be off on days 0-3 and on duty days 4-7
      const rotaDay0 = await rotaService.getRotaForDate('2024-01-01');
      expect(rotaDay0.dayShifts).toHaveLength(0);

      const rotaDay4 = await rotaService.getRotaForDate('2024-01-05');
      expect(rotaDay4.dayShifts).toHaveLength(1);
    });

    it('should handle negative offset correctly', async () => {
      const staff = createMockStaff({ id: 1, group: 'Day', daysOffset: -2 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // With offset -2, cycle shifts back 2 days
      // Day 0 becomes position 2 in cycle (on duty)
      const rotaDay0 = await rotaService.getRotaForDate('2024-01-01');
      expect(rotaDay0.dayShifts).toHaveLength(1);
    });

    it('should handle Night shift staff', async () => {
      const staff = createMockStaff({ id: 1, group: 'Night', daysOffset: 0 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      const rota = await rotaService.getRotaForDate('2024-01-01');

      expect(rota.nightShifts).toHaveLength(1);
      expect(rota.dayShifts).toHaveLength(0);
    });
  });

  describe('Supervisor Pattern', () => {
    it('should schedule supervisor on Day shift for days 0-3', async () => {
      const staff = createMockStaff({ 
        id: 1, 
        status: 'Supervisor', 
        group: null,
        cycleType: 'supervisor',
        daysOffset: 0 
      });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      for (let day = 0; day < 4; day++) {
        const date = `2024-01-0${day + 1}`;
        const rota = await rotaService.getRotaForDate(date);
        expect(rota.dayShifts).toHaveLength(1);
        expect(rota.nightShifts).toHaveLength(0);
      }
    });

    it('should schedule supervisor off for days 4-7', async () => {
      const staff = createMockStaff({ 
        id: 1, 
        status: 'Supervisor', 
        group: null,
        cycleType: 'supervisor',
        daysOffset: 0 
      });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      for (let day = 4; day < 8; day++) {
        const date = `2024-01-0${day + 1}`;
        const rota = await rotaService.getRotaForDate(date);
        expect(rota.dayShifts).toHaveLength(0);
        expect(rota.nightShifts).toHaveLength(0);
      }
    });

    it('should schedule supervisor on Night shift for days 8-11', async () => {
      const staff = createMockStaff({
        id: 1,
        status: 'Supervisor',
        group: null,
        cycleType: 'supervisor',
        daysOffset: 0
      });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      for (let day = 8; day < 12; day++) {
        const dayNum = day + 1;
        const date = `2024-01-${dayNum < 10 ? '0' + dayNum : dayNum}`;
        const rota = await rotaService.getRotaForDate(date);
        expect(rota.nightShifts).toHaveLength(1);
        expect(rota.dayShifts).toHaveLength(0);
      }
    });

    it('should schedule supervisor off for days 12-15', async () => {
      const staff = createMockStaff({
        id: 1,
        status: 'Supervisor',
        group: null,
        cycleType: 'supervisor',
        daysOffset: 0
      });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // Day 12 (Jan 13) will have night shift overlap from day 11 (Jan 12)
      const date12 = '2024-01-13';
      const rota12 = await rotaService.getRotaForDate(date12);
      expect(rota12.dayShifts).toHaveLength(0);
      expect(rota12.nightShifts).toHaveLength(1); // Overlap from previous night

      // Days 13-15 (Jan 14-16) should be completely off
      for (let day = 13; day < 16; day++) {
        const dayNum = day + 1;
        const date = `2024-01-${dayNum}`;
        const rota = await rotaService.getRotaForDate(date);
        expect(rota.dayShifts).toHaveLength(0);
        expect(rota.nightShifts).toHaveLength(0);
      }
    });

    it('should repeat supervisor pattern after 16 days', async () => {
      const staff = createMockStaff({ 
        id: 1, 
        status: 'Supervisor', 
        group: null,
        cycleType: 'supervisor',
        daysOffset: 0 
      });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // Day 16 should be same as day 0 (Day shift)
      const rota = await rotaService.getRotaForDate('2024-01-17');
      expect(rota.dayShifts).toHaveLength(1);
    });
  });

  describe('Night Shift Overlap', () => {
    it('should show night shift on both days it spans', async () => {
      const staff = createMockStaff({ id: 1, group: 'Night', daysOffset: 0 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // Night shift starts on Jan 1 at 20:00 and ends Jan 2 at 08:00
      const rotaJan1 = await rotaService.getRotaForDate('2024-01-01');
      const rotaJan2 = await rotaService.getRotaForDate('2024-01-02');

      // Should appear on both days
      expect(rotaJan1.nightShifts).toHaveLength(1);
      expect(rotaJan2.nightShifts).toHaveLength(1);
    });
  });

  describe('Manual Assignments', () => {
    it('should override calculated schedule with manual assignment', async () => {
      const staff = createMockStaff({ id: 1, group: 'Day', daysOffset: 0 });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      // Mock manual assignment for Night shift (overriding Day shift)
      mockOverrideRepo.findByDate.mockResolvedValue([{
        id: 1,
        staffId: 1,
        assignmentDate: '2024-01-01',
        shiftType: 'Night',
        shiftStart: null,
        shiftEnd: null,
        notes: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }]);

      const rota = await rotaService.getRotaForDate('2024-01-01');

      // Should show Night shift (manual) instead of Day shift (calculated)
      expect(rota.nightShifts).toHaveLength(1);
      expect(rota.nightShifts[0].isManualAssignment).toBe(true);
      expect(rota.dayShifts).toHaveLength(0);
    });

    it('should allow Relief staff to be manually assigned', async () => {
      const staff = createMockStaff({ id: 1, status: 'Relief', group: null, cycleType: null });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      mockOverrideRepo.findByDate.mockResolvedValue([{
        id: 1,
        staffId: 1,
        assignmentDate: '2024-01-01',
        shiftType: 'Day',
        shiftStart: null,
        shiftEnd: null,
        notes: 'Covering for sick leave',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }]);

      const rota = await rotaService.getRotaForDate('2024-01-01');

      expect(rota.dayShifts).toHaveLength(1);
      expect(rota.dayShifts[0].staff.status).toBe('Relief');
      expect(rota.dayShifts[0].isManualAssignment).toBe(true);
    });
  });

  describe('Relief Staff', () => {
    it('should not schedule Relief staff automatically', async () => {
      const staff = createMockStaff({ id: 1, status: 'Relief', group: null, cycleType: null });
      mockStaffRepo.findAll.mockResolvedValue([staff]);

      const rota = await rotaService.getRotaForDate('2024-01-01');

      expect(rota.dayShifts).toHaveLength(0);
      expect(rota.nightShifts).toHaveLength(0);
    });
  });
});

