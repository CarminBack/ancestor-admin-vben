import { defineEventHandler } from 'h3';
import { createOrder } from '~/utils/ancestor-business';
export default defineEventHandler(event => createOrder(event, 'supplies'));
