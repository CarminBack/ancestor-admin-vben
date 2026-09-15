import { createOrder } from '~/utils/ancestor-business';
export default defineEventHandler(event => createOrder(event, 'memorial', true));
