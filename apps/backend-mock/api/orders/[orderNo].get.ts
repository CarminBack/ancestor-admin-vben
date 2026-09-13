import { defineEventHandler } from 'h3';
import { orderDetail } from '~/utils/ancestor-business';
export default defineEventHandler(event => orderDetail(event));
