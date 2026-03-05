import cds from '@sap/cds/lib';

const { GET, POST, PATCH, DELETE, expect } = cds.test('.').in(__dirname + '/..');

// --- Auth helpers ---
const asAdmin  = { auth: { username: 'admin',  roles: ['admin']  } };
const asViewer = { auth: { username: 'viewer', roles: ['viewer'] } };

// --- Test data UUIDs from db/data/SalesOrders.csv ---
const ID1 = 'a1b2c3d4-0001-0000-0000-000000000001'; // Acme Corp
const ID2 = 'a1b2c3d4-0001-0000-0000-000000000002'; // Global Industries

describe('SalesOrderService', () => {

  // ── READ ──────────────────────────────────────────────

  describe('READ', () => {
    it('should return a list of SalesOrders', async () => {
      const { status, data } = await GET('/odata/v4/sales-order/SalesOrders', asViewer);
      expect(status).to.equal(200);
      expect(data.value).to.be.an('array');
    });

    it('should return a single SalesOrder by ID', async () => {
      const { status, data } = await GET(`/odata/v4/sales-order/SalesOrders(${ID1})`, asViewer);
      expect(status).to.equal(200);
      expect(data).to.have.property('ID');
      expect(data.customerName).to.equal('Acme Corp');
    });
  });

  // ── CREATE ────────────────────────────────────────────

  describe('CREATE', () => {
    it('should create a valid SalesOrder with explicit status', async () => {
      const payload = {
        customerName: 'Test Customer',
        orderDate: '2026-03-01',
        totalAmount: 5000.00,
        status: 'Open'
      };
      const { status, data } = await POST('/odata/v4/sales-order/SalesOrders', payload, asAdmin);
      expect(status).to.equal(201);
      expect(data.ID).to.exist;
      expect(data.status).to.equal('Open');
    });

    it('should default status to Open when not provided', async () => {
      const payload = {
        customerName: 'Default Status Customer',
        orderDate: '2026-03-01',
        totalAmount: 1000.00
      };
      const { status, data } = await POST('/odata/v4/sales-order/SalesOrders', payload, asAdmin);
      expect(status).to.equal(201);
      expect(data.status).to.equal('Open');
    });

    it('should reject CREATE without customerName', async () => {
      const payload = { orderDate: '2026-03-01', totalAmount: 500.00, status: 'Open' };
      const { status, data } = await POST('/odata/v4/sales-order/SalesOrders', payload, asAdmin);
      expect(status).to.equal(400);
      expect(data.error.message).to.include('customerName is required');
    });

    it('should reject CREATE with invalid status', async () => {
      const payload = { customerName: 'Bad Status Co', status: 'InvalidStatus' };
      const { status, data } = await POST('/odata/v4/sales-order/SalesOrders', payload, asAdmin);
      expect(status).to.equal(400);
      expect(data.error.message).to.include("Invalid status 'InvalidStatus'");
    });
  });

  // ── UPDATE ────────────────────────────────────────────

  describe('UPDATE', () => {
    it('should update status on an existing SalesOrder', async () => {
      const { status } = await PATCH(
        `/odata/v4/sales-order/SalesOrders(${ID1})`,
        { status: 'Confirmed' },
        asAdmin
      );
      expect(status).to.equal(200);
    });

    it('should reject UPDATE with invalid status', async () => {
      const { status, data } = await PATCH(
        `/odata/v4/sales-order/SalesOrders(${ID2})`,
        { status: 'BadStatus' },
        asAdmin
      );
      expect(status).to.equal(400);
      expect(data.error.message).to.include("Invalid status 'BadStatus'");
    });
  });

  // ── DELETE ────────────────────────────────────────────

  describe('DELETE', () => {
    it('should delete an existing SalesOrder', async () => {
      const { status } = await DELETE(`/odata/v4/sales-order/SalesOrders(${ID2})`, asAdmin);
      expect(status).to.equal(204);
    });
  });

  // ── AUTH ──────────────────────────────────────────────

  describe('Auth', () => {
    it('should reject unauthenticated READ', async () => {
      const { status } = await GET('/odata/v4/sales-order/SalesOrders');
      expect(status).to.equal(401);
    });

    it('should reject viewer role on CREATE', async () => {
      const { status } = await POST('/odata/v4/sales-order/SalesOrders', { customerName: 'X' }, asViewer);
      expect(status).to.equal(403);
    });

    it('should reject viewer role on DELETE', async () => {
      const { status } = await DELETE(`/odata/v4/sales-order/SalesOrders(${ID1})`, asViewer);
      expect(status).to.equal(403);
    });
  });

});
