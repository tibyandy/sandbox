const exemplo = {
  "swagger": "2.0",
  "info": {
    "description": "API para a jornada de vendas de benefícios Alelo para empresas de varejo (RHs). Viabiliza a consulta de preços, criação de cotações de venda e contratação dos produtos Alelo Tudo e Alelo POD.",
    "version": "1.0",
    "title": "retail-sales - DEV alpha-r20.08180957"
  },
  "host": "api-mtls.alelo.com",
  "basePath": "/retail-sales/v1",
  "tags": [
    {
      "name": "Domínios",
      "description": "Endpoints para consulta dos domínios da precificação"
    },
    {
      "name": "Precificação",
      "description": "Endpoints para realização de cotações e simulações de venda"
    },
    {
      "name": "Contratação",
      "description": "Endpoints para contratações e consulta de contratos"
    }
  ],
  "schemes": [
    "https"
  ],
  "consumes": [
    "application/json"
  ],
  "produces": [
    "application/json"
  ],
  "paths": {
    "/fees": {
      "get": {
        "tags": [
          "Domínios"
        ],
        "summary": "Lista taxas e tarifas",
        "description": "Lista todas as taxas e tarifas que podem ser retornadas em uma cotação",
        "operationId": "listFees",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Sucesso na consulta",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "fees": {
                      "type": "array",
                      "items": {
                        "$ref": "#/definitions/Result_Fee"
                      }
                    }
                  },
                  "required": [
                    "fees"
                  ]
                }
              }
            }
          }
        }
      },
      "parameters": []
    },
    "/cards": {
      "get": {
        "tags": [
          "Domínios"
        ],
        "summary": "Lista cartões",
        "description": "Lista os cartões (produtos Alelo) e os benefícios suportados para precificação e contratação",
        "operationId": "GetCards",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Sucesso na consulta",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "cards": {
                      "type": "array",
                      "items": {
                        "$ref": "#/definitions/Result_Card"
                      }
                    }
                  },
                  "required": [
                    "cards"
                  ]
                }
              }
            }
          }
        }
      },
      "parameters": []
    },
    "/benefits": {
      "get": {
        "tags": [
          "Domínios"
        ],
        "summary": "Lista benefícios",
        "description": "Lista os benefícios disponíveis para contratação dentro dos cartões",
        "operationId": "listBenefits",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Sucesso na consulta",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "benefits": {
                      "type": "array",
                      "items": {
                        "$ref": "#/definitions/Result_Benefit"
                      }
                    }
                  },
                  "required": [
                    "benefits"
                  ]
                }
              }
            }
          }
        }
      },
      "parameters": []
    },
    "/simulations": {
      "post": {
        "tags": [
          "Precificação"
        ],
        "summary": "Simula cotação",
        "description": "Simula uma cotação de venda, calculando as taxas e tarifas a serem aplicadas. Não grava o resultado",
        "operationId": "createSimulation",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "$ref": "#/definitions/Request_QuoteOrSimulation"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Simulação realizada com sucesso",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "quote": {
                      "$ref": "#/definitions/Result_Simulation"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Simulação inválida",
            "examples": {
              "application/json": {
                "errors": [
                  {
                    "code": "1001",
                    "message": "O identificador do usuário é obrigatório",
                    "source": "request"
                  },
                  {
                    "code": "2101",
                    "message": "O número de beneficiários deve ser maior que zero",
                    "source": "request"
                  }
                ]
              }
            },
            "schema": {
              "$ref": "#/definitions/Result_Error"
            }
          },
          "504": {
            "description": "Timeout do Gateway"
          }
        }
      },
      "parameters": []
    },
    "/quotes": {
      "post": {
        "tags": [
          "Precificação"
        ],
        "summary": "Gera cotação",
        "description": "Realiza uma cotação para possível venda, calculando taxas e tarifas e gravando seus resultados. Imutável. Descartada após um período (alguns meses) se não contratada",
        "operationId": "createQuote",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "$ref": "#/definitions/Request_QuoteOrSimulation"
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Cotação criada com sucesso",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "quote": {
                      "$ref": "#/definitions/Result_Quote"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Cotação inválida",
            "examples": {
              "application/json": {
                "errors": [
                  {
                    "code": "1001",
                    "message": "O identificador do usuário é obrigatório",
                    "source": "request"
                  },
                  {
                    "code": "2101",
                    "message": "O número de beneficiários deve ser maior que zero",
                    "source": "request"
                  }
                ]
              }
            },
            "schema": {
              "$ref": "#/definitions/Result_Error"
            }
          },
          "504": {
            "description": "Timeout do Gateway"
          }
        }
      },
      "parameters": []
    },
    "/quotes/{quoteId}": {
      "get": {
        "tags": [
          "Precificação"
        ],
        "summary": "Consulta cotação",
        "description": "Obtém as informações, taxas e tarifas calculadas de uma cotação realizada",
        "operationId": "getQuote",
        "parameters": [
          {
            "name": "quoteId",
            "in": "path",
            "description": "Identificador único da cotação gerada",
            "required": true,
            "type": "string",
            "x-example": "a1b2c3d4-e5f6-47a8-b9c0-1d2e3f4a5b6c"
          }
        ],
        "responses": {
          "200": {
            "description": "Cotação obtida com sucesso",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "quote": {
                      "$ref": "#/definitions/Result_Quote"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Cotação não encontrada",
            "schema": {
              "$ref": "#/definitions/Result_Error"
            }
          }
        }
      },
      "parameters": []
    },
    "/quotes/{quoteId}/contracts": {
      "get": {
        "tags": [
          "Contratação"
        ],
        "summary": "Consulta contratações de uma cotação",
        "parameters": [
          {
            "name": "quoteId",
            "in": "path",
            "description": "ID da cotação",
            "required": true,
            "type": "string",
            "format": "uuid",
            "x-example": "a1b2c3d4-e5f6-47a8-b9c0-1d2e3f4a5b6c"
          }
        ],
        "responses": {
          "200": {
            "description": "Solicitações de contratações encontradas para a cotação",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "contracts": {
                      "type": "array",
                      "items": {
                        "$ref": "#/definitions/Result_Contract"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Cotação não encontrada ou cotação sem solicitações de contratações",
            "schema": {
              "$ref": "#/definitions/Result_Error"
            }
          }
        }
      },
      "post": {
        "tags": [
          "Contratação"
        ],
        "summary": "Solicita contratações (async)",
        "description": "Dispara a contratação assíncrona dos produtos de uma cotação. Solicita uma ou mais contratações, dependendo dos produtos.",
        "operationId": "createContract",
        "parameters": [
          {
            "name": "quoteId",
            "in": "path",
            "description": "Identificador único da cotação a se contratar",
            "required": true,
            "type": "string",
            "format": "uuid",
            "x-example": "a1b2c3d4-e5f6-47a8-b9c0-1d2e3f4a5b6c"
          },
          {
            "in": "body",
            "name": "body",
            "description": "Contém as informações necessárias para a contratação:\n  - **account –** dados da conta (empresa contratante)\n  - **contacts –** dados dos contatos: vendedor e responsáveis da conta\n  - **payment –** dados de pagamento\n  - **proposal –** dados da proposta\n",
            "required": true,
            "schema": {
              "$ref": "#/definitions/Request_ContractQuote"
            }
          }
        ],
        "responses": {
          "202": {
            "description": "Contratação solicitada e em processamento",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "contracts": {
                      "type": "array",
                      "items": {
                        "$ref": "#/definitions/Result_Contract"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Contratação inválida",
            "examples": {
              "application/json": {
                "errors": [
                  {
                    "code": "400",
                    "message": "CNPJ do contratante é obrigatório",
                    "source": "request"
                  }
                ]
              }
            },
            "schema": {
              "$ref": "#/definitions/Result_Error"
            }
          },
          "404": {
            "description": "Cotação não encontrada",
            "schema": {
              "$ref": "#/definitions/Result_Error"
            }
          }
        }
      },
      "parameters": []
    },
    "/contracts/{contractId}": {
      "get": {
        "tags": [
          "Contratação"
        ],
        "summary": "Consulta solicitação de contratação",
        "description": "Verifica a situação de uma solicitação de contratação",
        "operationId": "getContract",
        "parameters": [
          {
            "name": "contractId",
            "in": "path",
            "description": "Identificador único da solicitação de contratação",
            "required": true,
            "type": "string",
            "format": "uuid",
            "x-example": "123e4567-e89b-42d3-a456-426614174000"
          }
        ],
        "responses": {
          "200": {
            "description": "Solicitação de contratação encontrada (status pode ser PROCESSING, CONTRACTED, INVALID ou ERROR).",
            "schema": {
              "type": "object",
              "properties": {
                "result": {
                  "type": "object",
                  "properties": {
                    "contract": {
                      "$ref": "#/definitions/Result_Contract"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Solicitação de contratação não encontrada",
            "schema": {
              "$ref": "#/definitions/Result_Error"
            }
          }
        }
      },
      "parameters": []
    }
  },
  "definitions": {
    "Result_Card": {
      "allOf": [
        {
          "$ref": "#/definitions/Out_CardObject"
        },
        {
          "type": "object",
          "required": [
            "benefits"
          ],
          "properties": {
            "benefits": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/Out_BenefitObject"
              }
            }
          }
        }
      ],
      "description": "Cartão de benefícios"
    },
    "Result_Fee": {
      "type": "object",
      "required": [
        "code",
        "name",
        "valueType"
      ],
      "properties": {
        "code": {
          "type": "string",
          "example": "REEMISSAO",
          "description": "(Chave) Código da taxa ou tarifa"
        },
        "name": {
          "type": "string",
          "example": "Tarifa de Reemissão de Cartão",
          "description": "Nome da taxa ou tarifa"
        },
        "valueType": {
          "type": "string",
          "example": "VM",
          "description": "Tipo de valor da tarifa / taxa:\n- `VM` - Valor Monetário da tarifa, em R$\n- `PC` - Percentual da taxa, ex: 3,21%\"\n",
          "enum": [
            "VM",
            "PC"
          ]
        }
      },
      "description": "Taxa ou tarifa"
    },
    "Result_Benefit": {
      "allOf": [
        {
          "$ref": "#/definitions/Out_BenefitObject"
        },
        {
          "required": [
            "card"
          ],
          "properties": {
            "card": {
              "$ref": "#/definitions/Out_CardObject"
            }
          },
          "description": "Benefício de um cartão"
        }
      ]
    },
    "Result_Quote": {
      "allOf": [
        {
          "type": "object",
          "required": [
            "id"
          ],
          "properties": {
            "id": {
              "type": "string",
              "example": "a1b2c3d4-e5f6-47a8-b9c0-1d2e3f4a5b6c",
              "description": "Identificador único da cotação gerada. Não gerado em /simulations"
            }
          }
        },
        {
          "$ref": "#/definitions/Result_Simulation"
        }
      ],
      "description": "Cotação de venda"
    },
    "Result_Simulation": {
      "type": "object",
      "required": [
        "benefits",
        "cards",
        "isPat",
        "user"
      ],
      "properties": {
        "user": {
          "type": "object",
          "description": "Usuário que requisitou a cotação / simulação",
          "properties": {
            "identifier": {
              "type": "string",
              "example": "USR-INT-012345",
              "description": "Identificador do usuário que requisitou a cotação / simulação"
            }
          },
          "required": [
            "identifier"
          ]
        },
        "isPat": {
          "type": "boolean",
          "example": true,
          "description": "Empresa contratante deseja usar auxílio PAT? (Programa de Alimentação do Trabalhador)"
        },
        "cards": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Out_QuoteCardObject"
          }
        },
        "benefits": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Out_QuoteBenefitObject"
          }
        }
      },
      "description": "Simulação de cotação de venda"
    },
    "Result_Contract": {
      "type": "object",
      "required": [
        "benefits",
        "card",
        "errors",
        "id",
        "status"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "example": "76711805-b7e5-454d-86b0-b361dc6ef62d",
          "description": "Identificador único da solicitação de contratação"
        },
        "contractNumber": {
          "type": "integer",
          "example": 11566626,
          "description": "Número do contrato, `null` enquanto status não for `CONTRACTED`"
        },
        "status": {
          "type": "string",
          "example": "INVALID",
          "description": "Situação da solicitação de contratação",
          "enum": [
            "PROCESSING",
            "CONTRACTED",
            "INVALID",
            "ERROR"
          ]
        },
        "card": {
          "type": "string",
          "example": "ALELO_POD",
          "description": "Cartão a ser contratado"
        },
        "benefits": {
          "type": "array",
          "example": [
            "POD_ALI_PAT",
            "POD_REF_PAT",
            "POD_OUTROS",
            "POD_SALDO_LIVRE"
          ],
          "description": "Benefícios a serem contratados",
          "items": {
            "type": "string"
          }
        },
        "errors": {
          "type": "array",
          "example": [
            {
              "code": "CRT3000-D012",
              "message": "forma de pagamento: Parceiro Vendedor não pode vender forma de pagamento enviada",
              "source": "externalApi"
            },
            {
              "code": "CRT3000-E070",
              "message": "dados do limite de crédito: Dados de limite de crédito não preenchidos",
              "source": "externalApi"
            },
            {
              "code": "CT11041",
              "message": "ERROR   1041",
              "source": "externalApi"
            }
          ],
          "description": "Descrição de erros ou validação assíncrona nesta solicitação de contratação",
          "items": {
            "$ref": "#/definitions/Out_ErrorObject"
          }
        }
      },
      "description": "Status do contrato com informações da solicitação"
    },
    "Result_Error": {
      "type": "object",
      "required": [
        "errors"
      ],
      "properties": {
        "errors": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Out_ErrorObject"
          }
        }
      },
      "description": "Resposta de erro"
    },
    "Out_CardObject": {
      "type": "object",
      "required": [
        "code",
        "name"
      ],
      "properties": {
        "code": {
          "type": "string",
          "example": "ALELO_TUDO",
          "description": "(Chave) Código do cartão"
        },
        "name": {
          "type": "string",
          "example": "Alelo Tudo",
          "description": "Nome do cartão"
        }
      },
      "description": "Cartão de benefícios"
    },
    "Out_FeeWithValueObject": {
      "allOf": [
        {
          "$ref": "#/definitions/Result_Fee"
        },
        {
          "type": "object",
          "required": [
            "value"
          ],
          "properties": {
            "value": {
              "type": "number",
              "example": 7.33,
              "description": "Valor da tarifa (em R$) ou taxa (em %)"
            }
          },
          "description": "Valor de taxa ou tarifa"
        }
      ]
    },
    "Out_BenefitObject": {
      "type": "object",
      "required": [
        "code",
        "name"
      ],
      "properties": {
        "code": {
          "type": "string",
          "example": "POD_REF_AUXILIO",
          "description": "(Chave) Código do benefício"
        },
        "name": {
          "type": "string",
          "example": "POD Refeição Auxílio",
          "description": "Nome do benefício"
        }
      },
      "description": "Benefício do cartão"
    },
    "Out_QuoteCardObject": {
      "type": "object",
      "required": [
        "code",
        "contractValidityInMonths",
        "count",
        "fees"
      ],
      "properties": {
        "code": {
          "type": "string",
          "example": "ALELO_TUDO",
          "description": "Código do produto sendo contratado"
        },
        "contractValidityInMonths": {
          "type": "integer",
          "example": 12,
          "description": "Vigência do contrato em meses"
        },
        "count": {
          "type": "integer",
          "example": 500,
          "description": "Estimativa de quantidade de cartões a serem emitidos"
        },
        "fees": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Out_FeeWithValueObject"
          }
        }
      },
      "description": "Cartão de benefícios a ser cotado"
    },
    "Out_QuoteBenefitObject": {
      "type": "object",
      "required": [
        "averageAmount",
        "code",
        "count",
        "fees",
        "limitedBenefitType"
      ],
      "properties": {
        "code": {
          "type": "string",
          "example": "MULTIBENEFICIOS",
          "description": "Código do benefício sendo contratado"
        },
        "count": {
          "type": "integer",
          "example": 300,
          "description": "Estimativa de quantidade de portadores do benefício"
        },
        "averageAmount": {
          "type": "number",
          "example": 412.67,
          "description": "Valor médio estimado de carga mensal do benefício (em R$)"
        },
        "limitedBenefitType": {
          "type": "boolean",
          "example": false,
          "description": "Indica se a modalidade é de limite de uso. Default = `false` - `false` - Saldo cumulativo (possível para todos os benefícios) - `true` - Limite de uso (somente multibenefícios)\n"
        },
        "fees": {
          "type": "array",
          "description": "Tarifas / taxas praticadas para o benefício",
          "items": {
            "$ref": "#/definitions/Out_FeeWithValueObject"
          }
        }
      },
      "description": "Benefício a ser cotado"
    },
    "Out_ErrorObject": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string",
          "example": "404",
          "description": "Código de erro"
        },
        "message": {
          "type": "string",
          "example": "Recurso não encontrado",
          "description": "Mensagem de erro"
        },
        "source": {
          "type": "string",
          "example": "request",
          "description": "Fonte do erro"
        }
      },
      "description": "Erro padrão"
    },
    "Request_QuoteOrSimulation": {
      "type": "object",
      "required": [
        "benefits",
        "cards",
        "isPat",
        "user"
      ],
      "properties": {
        "user": {
          "type": "object",
          "description": "Usuário solicitante",
          "properties": {
            "identifier": {
              "type": "string",
              "example": "USR-INT-012345",
              "description": "Identificador do usuário solicitante. Texto livre"
            }
          },
          "required": [
            "identifier"
          ]
        },
        "isPat": {
          "type": "boolean",
          "example": true,
          "description": "A contratante adere ao PAT? (Programa de Alimentação do Trabalhador)"
        },
        "cards": {
          "type": "array",
          "description": "Cartões (produtos) a serem contratados",
          "items": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string",
                "example": "ALELO_TUDO",
                "description": "Código do produto sendo contratado"
              },
              "contractValidityInMonths": {
                "type": "integer",
                "example": 12,
                "description": "Vigência do contrato em meses"
              },
              "count": {
                "type": "integer",
                "example": 500,
                "description": "Estimativa de quantidade de cartões a serem emitidos"
              }
            },
            "required": [
              "code",
              "contractValidityInMonths",
              "count"
            ]
          }
        },
        "benefits": {
          "type": "array",
          "description": "Benefícios a serem contratados",
          "items": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string",
                "example": "MULTIBENEFICIOS",
                "description": "Código do benefício sendo contratado"
              },
              "count": {
                "type": "integer",
                "example": 300,
                "description": "Estimativa de quantidade de portadores do benefício"
              },
              "averageAmount": {
                "type": "number",
                "example": 412.67,
                "description": "Valor médio estimado de carga mensal do benefício (em R$)"
              },
              "limitedBenefitType": {
                "type": "boolean",
                "description": "Indica se a modalidade é de limite de uso. Default = `false`\n- `false` - Saldo cumulativo (possível para todos os benefícios)\n- `true` - Limite de uso (somente multibenefícios)\n"
              }
            },
            "required": [
              "averageAmount",
              "code",
              "count",
              "limitedBenefitType"
            ]
          }
        }
      }
    },
    "Request_ContractQuote": {
      "type": "object",
      "required": [
        "account",
        "contacts",
        "payment",
        "proposal"
      ],
      "properties": {
        "account": {
          "type": "object",
          "allOf": [
            {
              "$ref": "#/definitions/In_ContractAccountObject"
            },
            {
              "description": "Dados da conta (empresa contratante)"
            }
          ]
        },
        "contacts": {
          "type": "object",
          "allOf": [
            {
              "$ref": "#/definitions/In_ContractContactsObject"
            },
            {
              "description": "Dados dos contatos: vendedor e responsáveis da conta"
            }
          ]
        },
        "payment": {
          "type": "object",
          "allOf": [
            {
              "$ref": "#/definitions/In_ContractPaymentObject"
            },
            {
              "description": "Dados de pagamento"
            }
          ]
        },
        "proposal": {
          "type": "object",
          "allOf": [
            {
              "$ref": "#/definitions/In_ContractProposalObject"
            },
            {
              "description": "Dados da proposta comercial"
            }
          ]
        }
      }
    },
    "In_ContractAccountObject": {
      "type": "object",
      "required": [
        "addresses",
        "branchChargingCnpj",
        "branchInvoiceCnpj",
        "cnaeDivisionType",
        "contracteeFantasyName",
        "contracteeName",
        "contracteeTypeCode",
        "documentNumber",
        "email",
        "establishmentDate",
        "isPat",
        "phones",
        "yearlyRevenue"
      ],
      "properties": {
        "addresses": {
          "type": "array",
          "description": "Endereços da conta (mínimo=1)",
          "items": {
            "$ref": "#/definitions/In_ContractAddressObject"
          }
        },
        "branchChargingCnpj": {
          "type": "string",
          "example": "12.345.678/0001-99",
          "description": "(Obrigatório para **proposal.isCentralizedBilling=true**) CNPJ de cobrança da filial"
        },
        "branchCount": {
          "type": "integer",
          "example": 13,
          "description": "Quantidade de filiais da empresa contratante (default=`1`)"
        },
        "branchInvoiceCnpj": {
          "type": "string",
          "example": "12.345.678/0001-99",
          "description": "(Obrigatório para **proposal.isCentralizedBilling=true**) CNPJ de faturamento da filial"
        },
        "cityInscription": {
          "type": "string",
          "example": "12345678",
          "description": "Inscrição municipal da empresa contratante (default=`\"ISENTO\"`)"
        },
        "cnaeDivisionType": {
          "type": "string",
          "example": "74",
          "description": "Tipo da divisão CNAE da empresa contratante"
        },
        "contracteeFantasyName": {
          "type": "string",
          "example": "TESTE VENDA NOVA FANTASIA",
          "description": "Nome fantasia da empresa contratante"
        },
        "contracteeName": {
          "type": "string",
          "example": "TESTE VENDA NOVA",
          "description": "Razão social (nome) da empresa contratante"
        },
        "contracteeTypeCode": {
          "type": "integer",
          "example": 1,
          "description": "Tipo da empresa contratante (`1` a `14` ou `99`) - `1` - EMPRESA PRIVADA - `2` - EMPRESA PRIVATIZADA - `3` - EMPRESA PUBL. ADM. DIR. GOV. UNIÃO - `4` - EMPRESA PUBL. ADM. DIR. GOV. ESTADO - `5` - EMPRESA PUBL. ADM. DIR. GOV. MUNICÍPIO - `6` - EMPRESA PUBL. ADM. INDIR. MISTA - `7` - EMPRESA PUBL. ADM. INDIR. FUNDAÇÃO PÚBLICA - `8` - EMPRESA PUBL. ADM. INDIR. ESTATAL - `9` - EMPRESA PUBL. ADM. INDIR. AUTARQUIA - `10` - EMPRESA NÃO DETENTORA DE CNPJ - `11` - EMPRESA PUBL. ADM. INDIRETA MISTA ESTADUAL - `12` - EMPRESA PUBL. ADM. INDIRETA MISTA MUNICIPAL - `13` - EMPRESA PUBL. ADM. INDIRETA AUTARQUIA ESTADUAL - `14` - EMPRESA PUBL. ADM. INDIRETA AUTARQUIA MUNICIPAL - `99` - NÃO INFORMADO\n"
        },
        "documentNumber": {
          "type": "string",
          "example": "12.345.678/0001-99",
          "description": "Número do documento (CNPJ) da empresa contratante"
        },
        "email": {
          "type": "string",
          "example": "teste@teste.nfe",
          "description": "Email da empresa contratante"
        },
        "employeeCount": {
          "type": "integer",
          "example": 345,
          "description": "Quantidade de funcionários da empresa contratante (default=`0`)"
        },
        "establishmentDate": {
          "type": "string",
          "format": "date",
          "example": "2020-08-12",
          "description": "Data de abertura da empresa contratante (`AAAA-MM-DD`)"
        },
        "isPat": {
          "type": "boolean",
          "example": true,
          "description": "Empresa adere ao PAT? Programa de Alimentação do Trabalhador"
        },
        "phones": {
          "type": "array",
          "description": "Telefones da empresa contratante (mínimo=1)",
          "items": {
            "$ref": "#/definitions/In_ContractPhoneObject"
          }
        },
        "stateInscription": {
          "type": "string",
          "example": "110042490114",
          "description": "Inscrição estadual da empresa contratante (default=`\"ISENTO\"`)"
        },
        "yearlyRevenue": {
          "type": "number",
          "example": 876876,
          "description": "Faturamento anual da empresa contratante"
        }
      },
      "description": "Conta do contrato"
    },
    "In_ContractContactsObject": {
      "type": "object",
      "required": [
        "accountDecisionMaker",
        "accountManager",
        "vendor"
      ],
      "properties": {
        "accountDecisionMaker": {
          "type": "object",
          "allOf": [
            {
              "$ref": "#/definitions/In_ContractContactAccountObject"
            },
            {
              "description": "Informações da pessoa responsável pelas decisões da conta (empresa contratante)"
            }
          ]
        },
        "accountManager": {
          "type": "object",
          "allOf": [
            {
              "$ref": "#/definitions/In_ContractContactAccountObject"
            },
            {
              "description": "Informações da pessoa gerente da conta (empresa contratante)"
            }
          ]
        },
        "vendor": {
          "type": "object",
          "description": "Informações da pessoa vendedora do contrato",
          "properties": {
            "aleloCommercialCode": {
              "type": "string",
              "example": "123213",
              "description": "(Obrigatório para vendas CBSS) Código comercial Alelo relacionado à venda"
            },
            "branchCheckDigit": {
              "type": "string",
              "example": "1",
              "description": "Dígito verificador da agência da pessoa vendedora que realizou a venda de contrato"
            },
            "branchCode": {
              "type": "integer",
              "example": 9090,
              "description": "Número da agência da pessoa vendedora que realizou a venda de contrato"
            },
            "name": {
              "type": "string",
              "example": "João Doe",
              "description": "Nome da pessoa vendedora"
            },
            "phone": {
              "type": "object",
              "allOf": [
                {
                  "$ref": "#/definitions/In_ContractPhoneObject"
                },
                {
                  "type": "object",
                  "description": "Telefone da pessoa vendedora do contrato",
                  "properties": {
                    "type": {
                      "description": "Tipo do telefone"
                    }
                  }
                }
              ]
            },
            "salesmanCpf": {
              "type": "string",
              "example": "987.654.321-98",
              "description": "CPF da pessoa vendedora"
            }
          },
          "required": [
            "branchCheckDigit",
            "branchCode",
            "name",
            "phone",
            "salesmanCpf"
          ]
        }
      },
      "description": "Contatos do contrato"
    },
    "In_ContractContactAccountObject": {
      "type": "object",
      "required": [
        "birthDate",
        "departmentName",
        "documentNumber",
        "email",
        "isEmployee",
        "name",
        "phones"
      ],
      "properties": {
        "birthDate": {
          "type": "string",
          "format": "date",
          "example": "2000-01-01",
          "description": "Data de nascimento da pessoa responsável da conta (`AAAA-MM-DD`)"
        },
        "departmentName": {
          "type": "string",
          "example": "FINANCEIRO",
          "description": "Nome do departamento da pessoa responsável da conta (default=\"nao informado\")"
        },
        "documentNumber": {
          "type": "string",
          "example": "302.889.910-87",
          "description": "Documento da pessoa responsável da conta"
        },
        "email": {
          "type": "string",
          "example": "teste@teste.interlocutor",
          "description": "E-mail da pessoa responsável da conta"
        },
        "gender": {
          "type": "string",
          "example": "M",
          "description": "Gênero da pessoa, opcional (M/F)",
          "enum": [
            "M",
            "F"
          ]
        },
        "isEmployee": {
          "type": "boolean",
          "example": true,
          "description": "A pessoa responsável da conta é funcionária da empresa?"
        },
        "name": {
          "type": "string",
          "example": "TESTE INTER RESPONSÁVEL",
          "description": "Nome da pessoa responsável da conta"
        },
        "phones": {
          "type": "array",
          "description": "Telefones da pessoa responsável da conta (mínimo=1)",
          "items": {
            "$ref": "#/definitions/In_ContractPhoneObject"
          }
        }
      },
      "description": "Contato do contrato"
    },
    "In_ContractPaymentObject": {
      "type": "object",
      "properties": {
        "creditLimit": {
          "type": "object",
          "description": "(Obrigatório para Multibenefícios Limite de Uso) Informações de limite de crédito",
          "properties": {
            "amount": {
              "type": "number",
              "example": 100000.01,
              "description": "Valor do limite de crédito, em Reais"
            },
            "creditorBankCode": {
              "type": "string",
              "example": "269",
              "description": "Código do banco do limite de crédito"
            },
            "dueDate": {
              "type": "string",
              "format": "date",
              "example": "2029-03-20",
              "description": "Data de vencimento do limite de crédito (`AAAA-MM-DD`)"
            },
            "startDate": {
              "type": "string",
              "format": "date",
              "example": "2028-03-21",
              "description": "Data de início de validade do limite de crédito (`AAAA-MM-DD`)"
            }
          },
          "required": [
            "amount",
            "creditorBankCode",
            "dueDate",
            "startDate"
          ]
        },
        "debitAccount": {
          "type": "object",
          "description": "(Obrigatório para Multibenefícios Saldo Cumulativo) Informações para débito em conta",
          "properties": {
            "accountDigit": {
              "type": "string",
              "example": "8",
              "description": "Dígito verificador da conta para débito"
            },
            "accountNumber": {
              "type": "integer",
              "example": 132435,
              "description": "Número da conta para débito"
            },
            "agencyCode": {
              "type": "integer",
              "example": 3232,
              "description": "Código da agência bancária para débito"
            },
            "agencyDigit": {
              "type": "string",
              "example": "3",
              "description": "Dígito verificador da agência bancária para débito"
            },
            "bankCode": {
              "type": "integer",
              "example": 369,
              "description": "Código do banco para débito"
            }
          },
          "required": [
            "accountDigit",
            "accountNumber",
            "agencyCode",
            "agencyDigit",
            "bankCode"
          ]
        },
        "deferredBillingDay": {
          "type": "integer",
          "example": 20,
          "description": "(Obrigatório para Multibenefícios Limite de Uso) Dia de faturamento (`1` a `31`)"
        },
        "deferredDueDays": {
          "type": "integer",
          "example": 1,
          "description": "(Obrigatório para Multibenefícios Limite de Uso) Prazo em dias de pagamento à partir da data de disponibilização de crédito"
        },
        "method": {
          "type": "string",
          "example": "BANK_SLIP",
          "description": "Forma de pagamento (default=BANK_SLIP)",
          "enum": [
            "BANK_SLIP"
          ]
        },
        "type": {
          "type": "string",
          "example": "PREPAID",
          "description": "Tipo de pagamento (default=PREPAID)",
          "enum": [
            "PREPAID"
          ]
        }
      },
      "description": "Dados de pagamento do contrato"
    },
    "In_ContractProposalObject": {
      "type": "object",
      "required": [
        "embossingContracteeName",
        "isCentralizedBilling",
        "isCentralizedDelivery",
        "isEmailedBilling",
        "isHomeDelivery",
        "maximumMonthlyUserBenefit",
        "signatureDate"
      ],
      "properties": {
        "cardLetterCategory": {
          "type": "string",
          "example": "STANDARD",
          "description": "(Somente para Alelo POD) Categoria de personalização da carta (default=`STANDARD`)",
          "enum": [
            "STANDARD",
            "PARTIAL_CUSTOMIZATION",
            "FULL_CUSTOMIZATION"
          ]
        },
        "cardPlasticCategory": {
          "type": "string",
          "example": "STANDARD",
          "description": "(Somente para Alelo POD) Categoria de personalização do plástico (default=`STANDARD`)",
          "enum": [
            "STANDARD",
            "PARTIAL_CUSTOMIZATION",
            "FULL_CUSTOMIZATION"
          ]
        },
        "embossingContracteeName": {
          "type": "string",
          "example": "TESTE VENDA NOVA",
          "description": "Nome da empresa a aparecer no cartão"
        },
        "isCentralizedBilling": {
          "type": "boolean",
          "example": true,
          "description": "Indica se o faturamento é centralizado"
        },
        "isCentralizedDelivery": {
          "type": "boolean",
          "example": true,
          "description": "Indica se a entrega é centralizada"
        },
        "isEmailedBilling": {
          "type": "boolean",
          "example": false,
          "description": "Indica se a cobrança será por email"
        },
        "isHomeDelivery": {
          "type": "boolean",
          "example": true,
          "description": "Indica se contratará entrega domiciliar individual na residência"
        },
        "maximumMonthlyUserBenefit": {
          "type": "number",
          "example": 999.98,
          "description": "Benefício máximo mensal do usuário"
        },
        "signatureDate": {
          "type": "string",
          "format": "date",
          "example": "2026-08-31",
          "description": "Data de assinatura da proposta - efetivação do contrato (`AAAA-MM-DD`)"
        }
      },
      "description": "Proposta do contrato"
    },
    "In_ContractAddressObject": {
      "type": "object",
      "required": [
        "city",
        "doorNumber",
        "neighborhood",
        "state",
        "street",
        "zipCode"
      ],
      "properties": {
        "city": {
          "type": "string",
          "example": "Urugutanga",
          "description": "Cidade do endereço"
        },
        "doorNumber": {
          "type": "string",
          "example": "14B",
          "description": "Número do logradouro"
        },
        "neighborhood": {
          "type": "string",
          "example": "Filantropia",
          "description": "Bairro da cidade"
        },
        "state": {
          "type": "string",
          "example": "AC",
          "description": "Sigla da UF"
        },
        "street": {
          "type": "string",
          "example": "R. dos Goitacazes",
          "description": "Logradouro"
        },
        "zipCode": {
          "type": "string",
          "example": "87654-321",
          "description": "CEP do endereço"
        }
      },
      "description": "Endereço do contrato"
    },
    "In_ContractPhoneObject": {
      "type": "object",
      "required": [
        "areaCode",
        "phoneNumber",
        "type"
      ],
      "properties": {
        "areaCode": {
          "type": "string",
          "example": "11",
          "description": "Código de área para DDD"
        },
        "countryCode": {
          "type": "string",
          "example": "55",
          "description": "Código do país (default=`\"55\"`)"
        },
        "extension": {
          "type": "string",
          "example": "301",
          "description": "Ramal de contato (opcional)"
        },
        "phoneNumber": {
          "type": "string",
          "example": "98765-4321",
          "description": "Número do telefone"
        },
        "type": {
          "type": "string",
          "example": "MOBILE",
          "description": "Tipo do telefone (sem repetição)",
          "enum": [
            "MOBILE",
            "LANDLINE",
            "FAX"
          ]
        }
      },
      "description": "Telefone do contrato"
    }
  }
}
