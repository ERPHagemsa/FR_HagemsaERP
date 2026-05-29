export interface DistritoUbicacion {
  codigo: string
  nombre: string
}

export interface ProvinciaUbicacion {
  codigo: string
  nombre: string
  distritos: DistritoUbicacion[]
}

export interface DepartamentoUbicacion {
  codigo: string
  nombre: string
  provincias: ProvinciaUbicacion[]
}

export interface PaisUbicacion {
  codigo: string
  nombre: string
  departamentos: DepartamentoUbicacion[]
}

export const paisesLatinoamerica: PaisUbicacion[] = [
  {
    codigo: "PE",
    nombre: "Peru",
    departamentos: [
      {
        codigo: "15",
        nombre: "Lima",
        provincias: [
          {
            codigo: "1501",
            nombre: "Lima",
            distritos: [
              { codigo: "150101", nombre: "Lima" },
              { codigo: "150103", nombre: "Ate" },
              { codigo: "150108", nombre: "Chorrillos" },
              { codigo: "150112", nombre: "Independencia" },
              { codigo: "150115", nombre: "La Victoria" },
              { codigo: "150122", nombre: "Miraflores" },
              { codigo: "150130", nombre: "San Borja" },
              { codigo: "150131", nombre: "San Isidro" },
              { codigo: "150132", nombre: "San Juan de Lurigancho" },
              { codigo: "150133", nombre: "San Juan de Miraflores" },
              { codigo: "150136", nombre: "San Miguel" },
              { codigo: "150140", nombre: "Santiago de Surco" },
            ],
          },
          {
            codigo: "1506",
            nombre: "Huaral",
            distritos: [
              { codigo: "150601", nombre: "Huaral" },
              { codigo: "150602", nombre: "Atavillos Alto" },
              { codigo: "150605", nombre: "Chancay" },
            ],
          },
        ],
      },
      {
        codigo: "04",
        nombre: "Arequipa",
        provincias: [
          {
            codigo: "0401",
            nombre: "Arequipa",
            distritos: [
              { codigo: "040101", nombre: "Arequipa" },
              { codigo: "040102", nombre: "Alto Selva Alegre" },
              { codigo: "040104", nombre: "Cerro Colorado" },
              { codigo: "040105", nombre: "Characato" },
              { codigo: "040110", nombre: "Miraflores" },
              { codigo: "040129", nombre: "Jose Luis Bustamante y Rivero" },
            ],
          },
          {
            codigo: "0403",
            nombre: "Caraveli",
            distritos: [
              { codigo: "040301", nombre: "Caraveli" },
              { codigo: "040302", nombre: "Acari" },
              { codigo: "040304", nombre: "Atico" },
            ],
          },
        ],
      },
      {
        codigo: "18",
        nombre: "Moquegua",
        provincias: [
          {
            codigo: "1801",
            nombre: "Mariscal Nieto",
            distritos: [
              { codigo: "180101", nombre: "Moquegua" },
              { codigo: "180102", nombre: "Carumas" },
              { codigo: "180104", nombre: "Samegua" },
            ],
          },
          {
            codigo: "1803",
            nombre: "Ilo",
            distritos: [
              { codigo: "180301", nombre: "Ilo" },
              { codigo: "180302", nombre: "El Algarrobal" },
              { codigo: "180303", nombre: "Pacocha" },
            ],
          },
        ],
      },
      {
        codigo: "23",
        nombre: "Tacna",
        provincias: [
          {
            codigo: "2301",
            nombre: "Tacna",
            distritos: [
              { codigo: "230101", nombre: "Tacna" },
              { codigo: "230102", nombre: "Alto de la Alianza" },
              { codigo: "230103", nombre: "Calana" },
              { codigo: "230104", nombre: "Ciudad Nueva" },
              { codigo: "230108", nombre: "Pocollay" },
              { codigo: "230110", nombre: "Coronel Gregorio Albarracin Lanchipa" },
              { codigo: "230111", nombre: "La Yarada Los Palos" },
            ],
          },
          {
            codigo: "2303",
            nombre: "Jorge Basadre",
            distritos: [
              { codigo: "230301", nombre: "Locumba" },
              { codigo: "230302", nombre: "Ilabaya" },
              { codigo: "230303", nombre: "Ite" },
            ],
          },
        ],
      },
    ],
  },
  { codigo: "BO", nombre: "Bolivia", departamentos: [] },
  { codigo: "CL", nombre: "Chile", departamentos: [] },
  { codigo: "CO", nombre: "Colombia", departamentos: [] },
  { codigo: "EC", nombre: "Ecuador", departamentos: [] },
  { codigo: "PY", nombre: "Paraguay", departamentos: [] },
  { codigo: "AR", nombre: "Argentina", departamentos: [] },
  { codigo: "BR", nombre: "Brasil", departamentos: [] },
  { codigo: "UY", nombre: "Uruguay", departamentos: [] },
]

