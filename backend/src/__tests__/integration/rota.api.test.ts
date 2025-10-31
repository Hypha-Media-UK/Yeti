import request from 'supertest';
import app from '../../app';

// Note: These tests require a running database
// In a real environment, you'd use a test database

describe('Rota API Integration Tests', () => {
  describe('GET /api/config/zero-date', () => {
    it('should return app configuration', async () => {
      const response = await request(app)
        .get('/api/config/zero-date')
        .expect(200);

      expect(response.body).toHaveProperty('appZeroDate');
      expect(response.body).toHaveProperty('timeZone');
      expect(response.body.timeZone).toBe('Europe/London');
    });
  });

  describe('GET /api/staff', () => {
    it('should return list of staff', async () => {
      const response = await request(app)
        .get('/api/staff')
        .expect(200);

      expect(response.body).toHaveProperty('staff');
      expect(Array.isArray(response.body.staff)).toBe(true);
    });

    it('should filter staff by status', async () => {
      const response = await request(app)
        .get('/api/staff?status=Regular')
        .expect(200);

      expect(response.body.staff.every((s: any) => s.status === 'Regular')).toBe(true);
    });

    it('should filter staff by pool status', async () => {
      const response = await request(app)
        .get('/api/staff?isPoolStaff=true')
        .expect(200);

      expect(response.body.staff.every((s: any) => s.isPoolStaff === true)).toBe(true);
    });
  });

  describe('GET /api/rota/day/:date', () => {
    it('should return rota for a specific date', async () => {
      const response = await request(app)
        .get('/api/rota/day/2024-01-01')
        .expect(200);

      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('dayShifts');
      expect(response.body).toHaveProperty('nightShifts');
      expect(response.body.date).toBe('2024-01-01');
      expect(Array.isArray(response.body.dayShifts)).toBe(true);
      expect(Array.isArray(response.body.nightShifts)).toBe(true);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/rota/day/invalid-date')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should include shift details in response', async () => {
      const response = await request(app)
        .get('/api/rota/day/2024-01-01')
        .expect(200);

      if (response.body.dayShifts.length > 0) {
        const shift = response.body.dayShifts[0];
        expect(shift).toHaveProperty('staff');
        expect(shift).toHaveProperty('shiftType');
        expect(shift).toHaveProperty('shiftStart');
        expect(shift).toHaveProperty('shiftEnd');
        expect(shift).toHaveProperty('isManualAssignment');
        expect(shift).toHaveProperty('isFixedSchedule');
        expect(shift.staff).toHaveProperty('firstName');
        expect(shift.staff).toHaveProperty('lastName');
      }
    });
  });

  describe('GET /api/rota/range', () => {
    it('should return rota for date range', async () => {
      const response = await request(app)
        .get('/api/rota/range?startDate=2024-01-01&endDate=2024-01-07')
        .expect(200);

      expect(response.body).toHaveProperty('days');
      expect(Array.isArray(response.body.days)).toBe(true);
      expect(response.body.days.length).toBe(7);
    });

    it('should return 400 if dates are missing', async () => {
      await request(app)
        .get('/api/rota/range')
        .expect(400);
    });
  });

  describe('POST /api/rota/assignments', () => {
    let createdAssignmentId: number;

    it('should create a manual assignment', async () => {
      const response = await request(app)
        .post('/api/rota/assignments')
        .send({
          staffId: 1,
          assignmentDate: '2024-06-01',
          shiftType: 'day',
          notes: 'Test assignment',
        })
        .expect(201);

      expect(response.body).toHaveProperty('assignment');
      expect(response.body.assignment).toHaveProperty('id');
      createdAssignmentId = response.body.assignment.id;
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/rota/assignments')
        .send({
          staffId: 1,
        })
        .expect(400);
    });

    it('should return 409 for duplicate assignment', async () => {
      await request(app)
        .post('/api/rota/assignments')
        .send({
          staffId: 1,
          assignmentDate: '2024-06-01',
          shiftType: 'day',
        })
        .expect(409);
    });

    afterAll(async () => {
      // Clean up created assignment
      if (createdAssignmentId) {
        await request(app)
          .delete(`/api/rota/assignments/${createdAssignmentId}`);
      }
    });
  });

  describe('DELETE /api/rota/assignments/:id', () => {
    it('should delete an assignment', async () => {
      // First create an assignment
      const createResponse = await request(app)
        .post('/api/rota/assignments')
        .send({
          staffId: 1,
          assignmentDate: '2024-07-01',
          shiftType: 'night',
        });

      const assignmentId = createResponse.body.assignment.id;

      // Then delete it
      await request(app)
        .delete(`/api/rota/assignments/${assignmentId}`)
        .expect(200);
    });

    it('should return 404 for non-existent assignment', async () => {
      await request(app)
        .delete('/api/rota/assignments/999999')
        .expect(404);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });
});

