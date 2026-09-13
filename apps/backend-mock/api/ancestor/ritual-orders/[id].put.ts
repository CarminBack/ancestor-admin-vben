import { defineEventHandler } from 'h3';
import { updateOrder } from '~/utils/ancestor-business';
export default defineEventHandler(event => updateOrder(event, 'memorial'));
