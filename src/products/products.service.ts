import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Ensure all required fields are present
    const productData = {
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      stock: createProductDto.stock,
      category: createProductDto.category,
      imageUrl: createProductDto.imageUrl || null,
    };
    
    return this.prisma.product.create({
      data: productData,
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    
    // Only include fields that are provided
    const updateData: any = {};
    if (updateProductDto.name !== undefined) updateData.name = updateProductDto.name;
    if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;
    if (updateProductDto.price !== undefined) updateData.price = updateProductDto.price;
    if (updateProductDto.stock !== undefined) updateData.stock = updateProductDto.stock;
    if (updateProductDto.category !== undefined) updateData.category = updateProductDto.category;
    if (updateProductDto.imageUrl !== undefined) updateData.imageUrl = updateProductDto.imageUrl;
    
    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}