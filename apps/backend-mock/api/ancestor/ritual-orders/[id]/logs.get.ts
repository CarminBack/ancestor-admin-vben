import { defineEventHandler } from 'h3';
import { orderLogs } from '~/utils/ancestor-business';
export default defineEventHandler(event => orderLogs(event));
