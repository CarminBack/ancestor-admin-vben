import { defineEventHandler } from 'h3';
import { records } from '~/utils/ancestor-business';
export default defineEventHandler(event => records(event, true));
