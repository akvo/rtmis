import React from 'react';
import { SearchBar } from '@rneui/themed';
import Stack from '../Stack';
import PageTitle from './PageTitle';
import { Content } from './Content';

const BaseLayout = ({
  children,
  title = null,
  subTitle = null,
  search = {
    placeholder: null,
    show: false,
    value: null,
    action: null,
  },
  leftComponent = null,
  leftContainerStyle = {},
  rightComponent = null,
  rightContainerStyle = {},
}) => {
  let searchProps = {
    placeholder: search?.placeholder,
    value: search?.value,
  };
  const titleProps = {
    leftComponent,
    leftContainerStyle,
    rightComponent,
    rightContainerStyle,
  };
  if (search?.action && typeof search.action === 'function') {
    searchProps = { ...searchProps, onChangeText: search.action };
  }
  return (
    <Stack>
      {title && <PageTitle text={title} subTitle={subTitle} {...titleProps} />}
      {search.show && <SearchBar {...searchProps} testID="search-bar" />}
      {children}
    </Stack>
  );
};

BaseLayout.Content = Content;

export default BaseLayout;
