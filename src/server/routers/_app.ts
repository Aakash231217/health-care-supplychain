import { router } from '../trpc';
import { productRouter } from './product';
import { vendorRouter } from './vendor';
import { rfqRouter } from './rfq';
import { shipmentRouter } from './shipment';
import { importRouter } from './import';
import { latviaPharmaRouter } from './latvia-pharma';
import { emailRouter } from './email';

export const appRouter = router({
  product: productRouter,
  vendor: vendorRouter,
  rfq: rfqRouter,
  shipment: shipmentRouter,
  import: importRouter,
  latviaPharma: latviaPharmaRouter,
  email: emailRouter,
});

export type AppRouter = typeof appRouter;
