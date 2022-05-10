import { Module } from '@nestjs/common';
import { TransportApplicationModule } from './modules/transport-appication/transport-application.module';
import { DriverApplicationModule } from './modules/driver-application/driver-application.module';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { LocationModule } from './modules/location/location.module';

@Module({
  imports: [
    TransportApplicationModule,
    DriverApplicationModule,
    UserModule,
    OrderModule,
    LocationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}