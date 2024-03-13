import React from 'react';
import { SearchBar } from '@rneui/themed';
import PropTypes from 'prop-types';
import Stack from '../Stack';
import PageTitle from './PageTitle';
import Content from './Content';

const BaseLayout = ({
  children,
  title,
  subTitle,
  search,
  leftComponent = null,
  leftContainerStyle = {},
  rightComponent = null,
  rightContainerStyle = {},
}) => (
    <Stack>
      {title && (
        <PageTitle
          text={title}
          subTitle={subTitle}
          {...{ leftComponent, leftContainerStyle, rightComponent, rightContainerStyle }}
        />
      )}
      {search.show && (
        <SearchBar
          placeholder={search.placeholder}
          value={search.value}
          onChangeText={search.action}
          testID="search-bar"
        />
      )}
      {children}
    </Stack>
  );

BaseLayout.Content = Content;

export default BaseLayout;

BaseLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subTitle: PropTypes.string,
  search: PropTypes.objectOf(
    PropTypes.shape({
      placeholder: PropTypes.string,
      show: PropTypes.bool,
      value: PropTypes.string,
      action: PropTypes.func.isRequired,
    }),
  ),
  leftComponent: PropTypes.node,
  // eslint-disable-next-line react/forbid-prop-types
  leftContainerStyle: PropTypes.object,
  rightComponent: PropTypes.node,
  // eslint-disable-next-line react/forbid-prop-types
  rightContainerStyle: PropTypes.object,
};

BaseLayout.defaultProps = {
  title: null,
  subTitle: null,
  search: {
    placeholder: null,
    show: false,
    value: null,
    action: null,
  },
  leftComponent: null,
  leftContainerStyle: null,
  rightComponent: null,
  rightContainerStyle: null,
};
