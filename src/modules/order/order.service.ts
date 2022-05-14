import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { UpdateOrderDto } from './model/update-order-dto.interface';
import { CreateOrderDto } from './model/create-order-dto.interface';
import { LocationService } from '../location/location.service';
import { CargoService } from '../cargo/cargo.service';
import { CreateLocationDto } from '../location/model/create-location-dto.interface';
import { CreateCargoDto } from '../cargo/model/create-cargo-dto.interface';

@Injectable()
export class OrderService {

  private locationWhere = {
      select: {
        home: true,
        city: {
          select: {
            name: true,
          },
        },
        street: {
          select: {
            name: true,
          },
        },
      },
    };

  private orderInfo = {
        id: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        fromLocation: this.locationWhere,
        toLocation: this.locationWhere,
        status: true,
      },

    constructor(
        private prismaService: PrismaService,
        private locationService: LocationService,
        private cargoService: CargoService,
    ) {}

    async createOrder(data: CreateOrderDto) {
        const [fromLocationId, toLocationId] = await this.getLocationsIds(
            data.fromLocation,
            data.toLocation,
        );
        const order = await this.prismaService.order.create({
            data: {
                ownerId: data.userId,
                toLocationId,
                fromLocationId,
            },
        });
        await this.createCargos(order.id, data.cargos);
        return order;
    }
    async getNotApprovedOrders() {
        return this.prismaService.order.findMany({
            select: this.orderInfo,
            where: {
                status: OrderStatus.PENDING,
            },
        });
    }

    async getUserOrders(ownerId: number) {
        return this.prismaService.order.findMany({
            select: this.orderInfo,
            where: { ownerId },
        });
    }

    // TODO: implement filtration for orders
    async getOrdersFilteredBy(status: OrderStatus, userId: number) {
        return {
            status,
            userId,
        };
    }

    async getOrder(id: number) {
        return this.prismaService.order.findUnique({
            select: this.orderInfo,
            where: { id },
        });
    }

    // To update cargos in the order use CargoController
    async updateOrder(id: number, data: UpdateOrderDto) {
        const [fromLocationId, toLocationId] = await this.getLocationsIds(
            data.fromLocation,
            data.toLocation,
        );
        return this.prismaService.order.update({
            where: { id },
            data: {
                toLocationId,
                fromLocationId,
            },
        });
    }

  async approveOrder(id: number) {
    return this.prismaService.order.update({
      select: { id: true },
      where: { id },
      data: { status: OrderStatus.APPROVED },
    });
  }

    async declineOrder(id: number) {
        return this.prismaService.order.update({
            select: { id: true },
            where: { id },
            data: { status: OrderStatus.DECLINED },
        });
    }

    private async getLocationsIds(
        fromLocation: CreateLocationDto,
        toLocation: CreateLocationDto,
    ): Promise<number[]> {
        return [
            await this.locationService
                .getOrCreateLocation(fromLocation)
                .then((res) => res['id']),
            await this.locationService
                .getOrCreateLocation(toLocation)
                .then((res) => res['id']),
        ];
    }

    private async createCargos(orderId: number, cargos: CreateCargoDto[]) {
        for (const cargo of cargos) {
            await this.cargoService.createCargo(orderId, cargo);
        }
    }
}
