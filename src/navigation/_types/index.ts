export enum ETabRoute {
  Catalogue = 'Catalogue',
  Collection = 'Collection',
}

export type TTabParamList = {
  [ETabRoute.Catalogue]: undefined
  [ETabRoute.Collection]: undefined
}
