import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class MovieDetail extends Document {
  @Prop({ required: true })
  detail: string;
}

export const MovieDetailSchema = SchemaFactory.createForClass(MovieDetail);
