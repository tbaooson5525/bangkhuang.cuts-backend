export class CreateThemeDto {
  name: string;
  slug: string;
  order?: number;
}

export class UpdateThemeDto {
  name?: string;
  slug?: string;
  order?: number;
  isActive?: boolean;
}

export class AddImagesDto {
  themeId: number;
  publicIds: string[];
}

export class ReorderImagesDto {
  images: { id: number; order: number }[];
}
