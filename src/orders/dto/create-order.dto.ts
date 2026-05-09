import { IsArray, ValidateNested, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  @Min(1)
  productId: number | undefined;

  @IsNumber()
  @Min(1)
  quantity: number | undefined;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[] | undefined;
}