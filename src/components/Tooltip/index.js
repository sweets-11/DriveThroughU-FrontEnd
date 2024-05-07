import * as React from 'react';
import {
  TouchableOpacity,
  Modal,
  View,
  I18nManager,
  Dimensions,
} from 'react-native';

import Triangle from './Triangle';
import {ScreenWidth, ScreenHeight, isIOS} from './helpers';
import getTooltipCoordinate from './getTooltipCoordinate';

class Tooltip extends React.Component {
  state = {
    isVisible: false,
    yOffset: 0,
    xOffset: 0,
    elementWidth: 0,
    elementHeight: 0,
  };

  renderedElement;
  timeout;

  toggleTooltip = () => {
    const {onClose, setShowToolTip = () => {}} = this.props;
    this.getElementPosition();
    setShowToolTip();
    this.setState(prevState => {
      if (prevState.isVisible && !isIOS) {
        onClose && onClose();
      }

      return {isVisible: !prevState.isVisible};
    });
  };

  wrapWithAction = (actionType, children) => {
    switch (actionType) {
      case 'press':
        return (
          <TouchableOpacity
            onPress={this.toggleTooltip}
            activeOpacity={1}
            {...this.props.toggleWrapperProps}>
            {children}
          </TouchableOpacity>
        );
      case 'longPress':
        return (
          <TouchableOpacity
            onLongPress={this.toggleTooltip}
            activeOpacity={1}
            {...this.props.toggleWrapperProps}>
            {children}
          </TouchableOpacity>
        );
      default:
        return children;
    }
  };

  getTooltipStyle = () => {
    const {yOffset, xOffset, elementHeight, elementWidth} = this.state;
    const {
      absoluteHeight = true,
      height,
      backgroundColor,
      withPointer,
      containerStyle,
    } = this.props;

    const {x, y} = getTooltipCoordinate(
      xOffset,
      yOffset,
      elementWidth,
      elementHeight,
      ScreenWidth,
      ScreenHeight,
      containerStyle.width,
      withPointer,
    );

    const getLeft = () => {
      const left = containerStyle?.width
        ? x + containerStyle.width + 16 > Dimensions.get('window').width
          ? Dimensions.get('window').width - containerStyle.width - 16
          : I18nManager.isRTL
          ? null
          : x
        : I18nManager.isRTL
        ? null
        : x;
      return left;
    };

    const tooltipStyle = {
      position: 'absolute',
      left: getLeft(),
      right: I18nManager.isRTL ? x : null,
      width: containerStyle.width,
      backgroundColor,
      // default styles
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      borderRadius: 10,
      padding: 10,
      ...containerStyle,
    };
    if (absoluteHeight) {
      tooltipStyle.height = height;
    }

    const pastMiddleLine = yOffset > y;
    if (pastMiddleLine) {
      tooltipStyle.bottom = ScreenHeight - y - 4;
      tooltipStyle.shadowOffset = {height: -6, width: 0};
    } else {
      tooltipStyle.top = y - 3;
      tooltipStyle.shadowOffset = {height: 6, width: 0};
    }

    return tooltipStyle;
  };

  renderPointer = pastMiddleLine => {
    const {yOffset, xOffset, elementHeight, elementWidth} = this.state;
    const {pointerStyle} = this.props;

    return (
      <View
        style={{
          position: 'absolute',
          top: pastMiddleLine ? yOffset - 6 : yOffset + elementHeight - 2,
          left: I18nManager.isRTL ? null : xOffset + elementWidth / 2 - 7.5,
          right: I18nManager.isRTL ? xOffset + elementWidth / 2 - 7.5 : null,
          zIndex: 10,
        }}>
        <Triangle style={pointerStyle} isDown={pastMiddleLine} />
      </View>
    );
  };
  renderContent = withTooltip => {
    const {popover, withPointer, highlightColor, actionType} = this.props;

    if (!withTooltip) {
      return this.wrapWithAction(actionType, this.props.children);
    }

    const {yOffset, xOffset, elementWidth, elementHeight} = this.state;
    const tooltipStyle = this.getTooltipStyle();
    return (
      <React.Fragment>
        <View
          style={{
            position: 'absolute',
            top: yOffset,
            left: I18nManager.isRTL ? null : xOffset,
            right: I18nManager.isRTL ? xOffset : null,
            backgroundColor: highlightColor,
            overflow: 'visible',
            width: elementWidth,
            height: elementHeight,
          }}>
          {this.props.children}
        </View>
        {withPointer && this.renderPointer(!tooltipStyle.top)}
        <View style={tooltipStyle}>{popover(this.toggleTooltip)}</View>
      </React.Fragment>
    );
  };

  componentDidMount() {
    // wait to compute onLayout values.
    this.timeout = setTimeout(this.getElementPosition, 500);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.isVisible !== false &&
      this.props.showToolTip === false &&
      prevProps.showToolTip !== false
    ) {
      this.setState({isVisible: this.props.showToolTip});
    }
  }

  getElementPosition = () => {
    this.renderedElement &&
      this.renderedElement.measureInWindow(
        (pageOffsetX, pageOffsetY, width, height) => {
          this.setState({
            xOffset: pageOffsetX,
            yOffset: pageOffsetY,
            elementWidth: width,
            elementHeight: height,
          });
        },
      );
  };

  render() {
    const {isVisible} = this.state;
    const {onClose, withOverlay, onOpen, overlayColor} = this.props;
    return (
      <View collapsable={false} ref={e => (this.renderedElement = e)}>
        {this.renderContent(false)}
        <Modal
          animationType="none"
          visible={isVisible}
          transparent={true}
          onDismiss={onClose}
          onShow={onOpen}
          onRequestClose={onClose}
          testID="tooltip">
          <TouchableOpacity
            style={styles.container(withOverlay, overlayColor)}
            onPress={this.toggleTooltip}
            activeOpacity={1}>
            {this.renderContent(true)}
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }
}
const styles = {
  container: (withOverlay, overlayColor) => ({
    backgroundColor: withOverlay
      ? overlayColor
        ? overlayColor
        : 'rgba(250, 250, 250, 0.0)'
      : '#fff0',
    flex: 1,
  }),
};

export default Tooltip;
