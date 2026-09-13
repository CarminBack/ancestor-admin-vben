import { defineEventHandler } from 'h3';
import { catalog } from '~/utils/ancestor-catalog';
export default defineEventHandler(event => catalog(event, 'products', false, 'detail'));
