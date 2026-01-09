import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Poultry Management System API',
      version: '1.0.0',
      description: 'API documentation for Poultry Management System',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: process.env.NEXTAUTH_URL || 'https://api.production.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token from NextAuth session',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'number',
              description: 'HTTP status code',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            role: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMIN', 'USER'],
              description: 'User role',
            },
            status: {
              type: 'number',
              description: 'User status (1 = active, 0 = inactive)',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
          },
          example: {
            id: '1',
            name: 'Chicken Feed',
            description: 'Premium chicken feed for poultry',
          },
        },
        Customer: {
          type: 'object',
          properties: {
            acc_id: {
              type: 'string',
              description: 'Customer account ID',
            },
            customer_name: {
              type: 'string',
              description: 'Customer name',
            },
            customer_address: {
              type: 'string',
              description: 'Customer address',
            },
            customer_contact: {
              type: 'string',
              description: 'Customer contact number',
            },
            customer_cnic: {
              type: 'string',
              description: 'Customer CNIC number',
            },
            cgroup_id: {
              type: 'string',
              description: 'Customer group ID',
            },
            subarea_id: {
              type: 'string',
              description: 'Subarea ID',
            },
          },
          example: {
            acc_id: '1',
            customer_name: 'John Doe',
            customer_address: '123 Main Street, City',
            customer_contact: '+923001234567',
            customer_cnic: '12345-1234567-1',
            cgroup_id: '1',
            subarea_id: '1',
          },
        },
        Supplier: {
          type: 'object',
          properties: {
            acc_id: {
              type: 'string',
              description: 'Supplier account ID',
            },
            supplier_name: {
              type: 'string',
              description: 'Supplier name',
            },
            supplier_address: {
              type: 'string',
              description: 'Supplier address',
            },
            supplier_contact: {
              type: 'string',
              description: 'Supplier contact number',
            },
          },
          example: {
            acc_id: '1',
            supplier_name: 'ABC Suppliers',
            supplier_address: '456 Business Ave',
            supplier_contact: '+923001234568',
          },
        },
        Employee: {
          type: 'object',
          properties: {
            emp_id: {
              type: 'string',
              description: 'Employee ID',
            },
            emp_name: {
              type: 'string',
              description: 'Employee name',
            },
            emp_contact: {
              type: 'string',
              description: 'Employee contact',
            },
            designation_id: {
              type: 'string',
              description: 'Designation ID',
            },
            area_id: {
              type: 'string',
              description: 'Area ID',
            },
          },
          example: {
            emp_id: '1',
            emp_name: 'Ahmed Khan',
            emp_contact: '+923001234569',
            designation_id: '1',
            area_id: '1',
          },
        },
        Farm: {
          type: 'object',
          properties: {
            farm_id: {
              type: 'string',
              description: 'Farm ID',
            },
            farm_name: {
              type: 'string',
              description: 'Farm name',
            },
            farm_address: {
              type: 'string',
              description: 'Farm address',
            },
            status: {
              type: 'number',
              description: 'Farm status (1 = active, 0 = inactive)',
            },
          },
          example: {
            farm_id: '1',
            farm_name: 'Main Farm',
            farm_address: '789 Farm Road',
            status: 1,
          },
        },
        Floc: {
          type: 'object',
          properties: {
            floc_id: {
              type: 'string',
              description: 'Floc ID',
            },
            floc_name: {
              type: 'string',
              description: 'Floc name',
            },
            farm_id: {
              type: 'string',
              description: 'Farm ID',
            },
            starting_date: {
              type: 'string',
              format: 'date',
              description: 'Starting date',
            },
            ending_date: {
              type: 'string',
              format: 'date',
              description: 'Ending date',
            },
          },
          example: {
            floc_id: '1',
            floc_name: 'Floc A',
            farm_id: '1',
            starting_date: '2024-01-01',
            ending_date: null,
          },
        },
        Sale: {
          type: 'object',
          properties: {
            sale_id: {
              type: 'string',
              description: 'Sale ID',
            },
            sale_date: {
              type: 'string',
              format: 'date',
              description: 'Sale date',
            },
            customer_id: {
              type: 'string',
              description: 'Customer ID',
            },
            total_amount: {
              type: 'number',
              description: 'Total sale amount',
            },
          },
          example: {
            sale_id: '1',
            sale_date: '2024-01-15',
            customer_id: '1',
            total_amount: 50000,
          },
        },
        Purchase: {
          type: 'object',
          properties: {
            purchase_id: {
              type: 'string',
              description: 'Purchase ID',
            },
            purchase_date: {
              type: 'string',
              format: 'date',
              description: 'Purchase date',
            },
            supplier_id: {
              type: 'string',
              description: 'Supplier ID',
            },
            total_amount: {
              type: 'number',
              description: 'Total purchase amount',
            },
          },
          example: {
            purchase_id: '1',
            purchase_date: '2024-01-15',
            supplier_id: '1',
            total_amount: 30000,
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              example: 'Success',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Products',
        description: 'Product management endpoints',
      },
      {
        name: 'Customers',
        description: 'Customer management endpoints',
      },
      {
        name: 'Suppliers',
        description: 'Supplier management endpoints',
      },
      {
        name: 'Employees',
        description: 'Employee management endpoints',
      },
      {
        name: 'Farms',
        description: 'Farm management endpoints',
      },
      {
        name: 'Flocs',
        description: 'Floc management endpoints',
      },
      {
        name: 'Sales',
        description: 'Sales management endpoints',
      },
      {
        name: 'Purchases',
        description: 'Purchase management endpoints',
      },
      {
        name: 'Accounts',
        description: 'Account management endpoints',
      },
      {
        name: 'Transactions',
        description: 'Transaction management endpoints',
      },
    ],
  },
  apis: [
    './app/api/**/*.js', // Path to the API files
    './app/api/**/*.jsx', // Path to the API files (if any)
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

