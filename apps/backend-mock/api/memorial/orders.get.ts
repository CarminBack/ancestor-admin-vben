import { defineEventHandler } from 'h3';
import { listOrders } from '~/utils/ancestor-business';
export default defineEventHandler(event => listOrders(event, 'memorial'));
