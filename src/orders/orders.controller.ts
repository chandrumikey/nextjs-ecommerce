import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.ordersService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(+id, req.user.userId, req.user.role);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(+id, status);
  }

  @Post(':id/cancel')
  cancelOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelOrder(+id, req.user.userId, req.user.role);
  }
}