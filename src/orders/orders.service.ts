import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    // Validate that items array exists and is not empty
    if (!createOrderDto.items || !Array.isArray(createOrderDto.items) || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let total = 0;
    const orderItems: Array<{
      productId: number;
      quantity: number;
      price: number;
    }> = [];

    for (const item of createOrderDto.items) {
      // Type assertion to ensure item has required properties
      const validatedItem = item as OrderItemDto;
      
      // Validate item properties
      if (!validatedItem.productId) {
        throw new BadRequestException('Each order item must have productId');
      }
      
      if (!validatedItem.quantity || validatedItem.quantity <= 0) {
        throw new BadRequestException(`Quantity must be greater than 0 for product ID ${validatedItem.productId}`);
      }

      const product = await this.prisma.product.findUnique({
        where: { id: validatedItem.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${validatedItem.productId} not found`);
      }

      if (product.stock < validatedItem.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${validatedItem.quantity}`);
      }

      const itemTotal = product.price * validatedItem.quantity;
      total += itemTotal;

      // Now TypeScript knows quantity is definitely a number
      orderItems.push({
        productId: validatedItem.productId,
        quantity: validatedItem.quantity,
        price: product.price,
      });

      // Update product stock
      await this.prisma.product.update({
        where: { id: validatedItem.productId },
        data: { stock: product.stock - validatedItem.quantity },
      });
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return order;
  }

  async findAll(userId: number, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number, role: string) {
    const where = role === 'ADMIN' ? { id } : { id, userId };
    
    const order = await this.prisma.order.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: number, status: string) {
    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async cancelOrder(id: number, userId: number, role: string) {
    const where = role === 'ADMIN' ? { id } : { id, userId };
    
    const order = await this.prisma.order.findUnique({
      where,
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel an order that has already been delivered');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }

    // Restore product stocks
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}