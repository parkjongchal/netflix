import { PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';

// enum MovieGenre {
//   Fantasy = 'fantasy',
//   Action = 'action',
// }
// @ValidatorConstraint()
// class PasswordValidator implements ValidatorConstraintInterface {
//   validate(
//     value: any,
//     _validationArguments?: ValidationArguments,
//   ): Promise<boolean> | boolean {
//     // 비밀번호 길이는 4-8
//     return value.length > 4 && value.length < 8;
//   }
//   defaultMessage?(_validationArguments?: ValidationArguments): string {
//     return '비밀번호의 길이는 4~8자 여야 합니다. 입력된 비밀번호($value)';
//   }
// }
// 데코레이터
// function IsPasswordValid(validationOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validationOptions,
//       validator: PasswordValidator,
//     });
//   };
// }
export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  // 유용한 class-validator
  // @IsDefined() null || undefined 면 안된다.
  // @IsOptional()
  // @Equals('code factory')
  // @NotEquals('code factory')
  // @IsEmpty() null || undefined || '' 이어야 한다.
  // @IsNotEmpty() null || undefined || '' 이면 안된다.
  // @IsIn(['action', 'fantasy']) 배열에 속한 아이템 중 하나여야 한다.
  // @IsNotIn(['action', 'fantasy']) 배열에 속한 아이템이 아니어야 한다.
  // @IsBoolean()
  // @IsString()
  // @IsNumber()
  // @IsInt()
  // @IsArray()
  // @IsEnum(MovieGenre)
  // @IsDateString() ISO 8601 ex) 2024-07-07T12:00:00.000Z
  // @IsDivisibleBy(5) 5로 나눌수 있는가 나눴을때 나머지가 0이어야 함.
  // @IsPositive()  양수인가
  // @IsNegative()  음수인가
  // @Min(100) 최소 입력 되어야 하는 값 최소 100이상의 값을 넣어야 함.
  // @Max(100) 100이하의 값을 넣어야 한다.
  // @Contains('code factory') 해당 글자가 포함되어 있어야 한다.
  // @NotContains('code factory') 해당 글자가 포함되어 있으면 안된다.
  // @IsAlphanumeric() 알파벳과 숫자로 이루어져 있냐? //한글도 안되고 공백도 안됨.
  // @IsCreditCard() 존재할수 있는 카드 번호 인지 확인함.
  // @IsHexColor() 컬러코드인지 아닌지
  // @MaxLength(16) 최대 길이
  // @MinLength(4)  최소 길이
  // @IsLatLong() // 40.7128,-74.006012 위도,경도
  // @Validate(PasswordValidator) @IsPasswordValid()와 같은 내용이다.
  // @IsPasswordValid()
  // test: string;
}
