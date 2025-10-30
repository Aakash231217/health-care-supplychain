import { router } from '../trpc';
import { productRouter } from './product';
import { vendorRouter } from './vendor';
import { rfqRouter } from './rfq';
import { shipmentRouter } from './shipment';
import { importRouter } from './import';

export const appRouter = router({
  product: productRouter,
  vendor: vendorRouter,
  rfq: rfqRouter,
  shipment: shipmentRouter,
  import: importRouter,
});

export type AppRouter = typeof appRouter;
