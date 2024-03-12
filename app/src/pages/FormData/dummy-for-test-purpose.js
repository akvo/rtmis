export const washInSchool = {
  createdAt: '2023-08-03T10:48:49.470Z',
  duration: 3,
  form: 3,
  geo: '-7.391187|109.4651083',
  id: 5,
  json: '"{\\"1681103820975\\":65,\\"1681107307245\\":\\"Test Village\\",\\"1681107334328\\":[-7.391187,109.4651083],\\"1681178759979\\":[\\"Yes\\"],\\"1681108078143\\":\\"Test scool\\",\\"1681108101856\\":[\\"Rural\\"],\\"1681108181965\\":[\\"Classic\\"],\\"1681107224764\\":[\\"Yes\\"],\\"1681108436898\\":[\\"Pipeline connection / Piped water to yard/plot\\"],\\"1681108776850\\":[\\"Totally Functional\\"],\\"1681108950633\\":[\\"Yes\\"],\\"1681109061118\\":[\\"Yes\\"],\\"1681109157654\\":[\\"No\\"],\\"1681110132819\\":[\\"Clean\\"],\\"1681107239045\\":[\\"No\\"],\\"1681110373320\\":[\\"In the free area\\"],\\"1681107334444\\":\\"2021-12-22\\",\\"1681107335555\\":\\"data:image/jpeg;base64,dummyR0ndomb5e64\\",\\"1681107261379\\":[\\"No\\"]}"',
  name: 'Bagassi - Test Village',
  submitted: 1,
  submittedAt: '2023-08-03T10:48:49.470Z',
  syncedAt: '2023-08-03T10:48:56.159Z',
  user: 1,
};

export const washInSchoolForm = {
  id: 1681103820972,
  form: 'WASH in Schools',
  type: 1,
  languages: ['en', 'fr'],
  defaultLanguage: 'en',
  translations: [
    {
      language: 'fr',
      name: 'Questionnaire Ecoles',
    },
  ],
  question_group: [
    {
      id: 1681103820974,
      question_group: 'Localisation',
      order: 1,
      repeatable: false,
      question: [
        {
          id: 1681103820975,
          order: 1,
          questionGroupId: 1681103820974,
          question: 'Locality',
          type: 'cascade',
          source: {
            file: 'administration.sqlite',
            parent_id: 0,
          },
          required: true,
          meta: true,
          translations: [
            {
              language: 'fr',
              name: 'Localite',
            },
          ],
        },
        {
          id: 1681107307245,
          order: 2,
          questionGroupId: 1681103820974,
          question: 'Village',
          type: 'text',
          required: false,
          meta: true,
          translations: [
            {
              language: 'fr',
              name: 'Village',
            },
          ],
        },
        {
          id: 1681107334328,
          order: 3,
          questionGroupId: 1681103820974,
          question: 'School GPS coordinates',
          type: 'geo',
          required: true,
          meta: true,
          translations: [
            {
              language: 'fr',
              name: "Coordonnes GPS de l'école",
            },
          ],
        },
        {
          id: 1681107334444,
          order: 4,
          questionGroupId: 1681103820974,
          question: 'School registered date',
          type: 'date',
          required: true,
          meta: true,
          translations: [
            {
              language: 'fr',
              name: "Date d'inscription à l'école",
            },
          ],
        },
        {
          id: 1681107335555,
          order: 4,
          questionGroupId: 1681103820974,
          question: 'School photo',
          type: 'photo',
          required: true,
          meta: true,
          translations: [
            {
              language: 'fr',
              name: "Photo d'école",
            },
          ],
        },
      ],
      translations: [
        {
          language: 'fr',
          name: 'Localisation',
        },
      ],
    },
    {
      id: 1681178759978,
      question_group: 'Consent',
      order: 2,
      repeatable: false,
      question: [
        {
          id: 1681178759979,
          order: 1,
          questionGroupId: 1681078759978,
          question:
            'We carry out this interview to better understand the situation in terms of information and prevention on the COVVI-19 in your area. Do you willing to participate to participate?',
          type: 'option',
          required: true,
          meta: false,
          translations: [
            {
              language: 'fr',
              name: 'Nous réalisons cet entretien pour mieux comprendre la situation en matière d’information et de prévention sur la COVID-19 dans votre zone.Acceptez vous volontier de participer?',
            },
          ],
          options: [
            {
              id: 1681078772186,
              code: null,
              name: 'Yes',
              order: 1,
              translations: [
                {
                  language: 'fr',
                  name: 'Oui',
                },
              ],
            },
            {
              id: 1681078772187,
              code: null,
              name: 'No',
              order: 2,
              translations: [
                {
                  language: 'fr',
                  name: 'Non',
                },
              ],
            },
          ],
        },
      ],
      translations: [
        {
          language: 'fr',
          name: 'Consentement',
        },
      ],
    },
  ],
};
