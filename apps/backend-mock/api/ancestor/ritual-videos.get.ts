import { defineEventHandler } from 'h3';
import { videoAction } from '~/utils/ancestor-business';
export default defineEventHandler(event => videoAction(event, 'list'));
