import i18n from '../i18n';

describe('i18n library', () => {
  it('should translate form correctly', () => {
    const data = {
      form: 'Urban sanitation',
      translations: [{ language: 'fr', name: 'Assainissement urbain' }],
    };
    const expected = {
      form: 'Assainissement urbain',
      translations: [{ language: 'fr', name: 'Assainissement urbain' }],
    };
    const activeLang = 'fr';
    const result = i18n.transform(activeLang, data);

    expect(result).toEqual(expected);
  });

  it('should translate tooltip correctly', () => {
    const data = {
      text: 'Actual location',
      translations: [{ language: 'fr', name: 'Emplacement réel' }],
    };
    const expected = {
      text: 'Emplacement réel',
      translations: [{ language: 'fr', name: 'Emplacement réel' }],
    };
    const activeLang = 'fr';
    const result = i18n.transform(activeLang, data);

    expect(result).toEqual(expected);
  });

  it('should translate question group correctly', () => {
    const data = {
      name: 'Introduction',
      translations: [{ language: 'fr', name: 'Présentation' }],
    };
    const expected = {
      name: 'Présentation',
      translations: [{ language: 'fr', name: 'Présentation' }],
    };
    const activeLang = 'fr';
    const result = i18n.transform(activeLang, data);

    expect(result).toEqual(expected);
  });

  it('should translate options correctly', () => {
    const data = {
      name: 'male',
      label: 'Male',
      translations: [{ language: 'id', name: 'Laki-laki' }],
    };
    const expected = {
      name: 'male',
      label: 'Laki-laki',
      translations: [{ language: 'id', name: 'Laki-laki' }],
    };

    const activeLang = 'id';
    const result = i18n.transform(activeLang, data);

    expect(result).toEqual(expected);
  });

  it('should fallback to default language when lang is invalid', () => {
    const data = {
      name: 'female',
      label: 'Female',
      translations: [{ language: 'id', name: 'Perempuan' }],
    };

    const activeLang = 'fr';
    const result = i18n.transform(activeLang, data);

    expect(result).toEqual(data);
  });

  it('should fallback to default language when translations is not available', () => {
    const data = { name: 'male', label: 'Male' };
    const activeLang = 'id';
    const result = i18n.transform(activeLang, data);

    expect(result).toEqual(data);
  });

  it('should return undefiend when the option has invalid props', () => {
    let data = { translations: [{ language: 'nl' }] };
    const expected = { label: undefined, translations: [{ language: 'nl' }] };

    const activeLang = 'id';
    const result1 = i18n.transform(activeLang, data);

    expect(result1).toEqual(expected);

    data = null;

    const result2 = i18n.transform(activeLang, data);
    expect(result2).toEqual(data);
  });
});
