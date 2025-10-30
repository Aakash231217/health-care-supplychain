import { router } from '../trpc';
import { productRouter } from './product';
import { vendorRouter } from './vendor';
import { rfqRouter } from './rfq';
import { shipmentRouter } from './shipment';

export const appRouter = router({
  product: productRouter,
  vendor: vendorRouter,
  rfq: rfqRouter,
  shipment: shipmentRouter,
});

export type AppRouter = typeof appRouter;
