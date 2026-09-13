import { defineEventHandler } from 'h3';
import { settings } from '~/utils/ancestor-catalog';
export default defineEventHandler(event => settings(event, false, false));
