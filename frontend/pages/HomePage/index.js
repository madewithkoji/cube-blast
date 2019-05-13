import React from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import Koji from 'koji-tools';

import Game from './components/Game';

const Container = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    height: 100vh;
    background: url(${() => Koji.config.general.backgroundImage}) top left / 100% 100%;
    flex-direction: column;
    text-align:center;
`;

function getFontFamily(ff) {
    const start = ff.indexOf('family=');
    if(start === -1) return 'sans-serif';
    let end = ff.indexOf('&', start);
    if(end === -1) end = undefined;
    return ff.slice(start + 7, end);
}

const Cover = styled.div`
    transition: opacity 0.7s ease-in-out;
    width: 100%;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    background: linear-gradient(transparent 0, ${({ color }) => color});
    opacity: ${({ colorSwitch }) => colorSwitch ? 1 : 0};
`;

const Content = styled.div`
    width: 100%;
    height: 100vh;
    opacity: 1;
    z-index: 1;
    color: ${() => Koji.config.style.textColor};
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
    font-family: '${() => getFontFamily(Koji.config.general.fontFamily)}', sans-serif;
`;

const Title = styled.h1`
    font-size: 32px;
`;

const Start = styled.button`
    font-size: 36px;
    background: rgba(0,0,0,0);
    border: 1px solid ${() => Koji.config.style.textColor};
    color: ${() => Koji.config.style.textColor};
    box-shadow: 0 2px 12px rgba(0,0,0,0.24);
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
    cursor: pointer;
    margin: 36px;
    margin-top: 100px;

    transition: background-color 0.1s ease-in-out;

    :hover {
        background-color: rgba(0,0,0,0.1);
    }
`;

class HomePage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            color: '#fff',
            start: false,
            muted: localStorage.getItem('muted') === 'true' || false,
        };
    }

  flash(color) {
    this.setState({ color, colorSwitch: true });
    setTimeout(() => this.setState({ colorSwitch: false }), 700);
  }

  toggleMute(muted) {
      this.setState({ muted });
      localStorage.setItem('muted', muted);
  }

  render() {
    return (
        <Container color={this.state.color}>
            <Helmet defaultTitle={Koji.config.general.name}>
                <link href={Koji.config.general.fontFamily} rel="stylesheet" />
                <link rel="icon" href={Koji.config.metadata.icon} sizes="32x32" />
            </Helmet>
            <Cover color={this.state.color} colorSwitch={this.state.colorSwitch} />
            <Content>
                <Title>
                    {Koji.config.general.name}&nbsp;&nbsp;
                    {this.state.muted ? 
                        <FaVolumeMute onClick={() => this.toggleMute(false)} />
                      : <FaVolumeUp onClick={() => this.toggleMute(true)} />
                    }
                </Title>
                {this.state.start ? (
                    <Game onFlash={(color) => this.flash(color)} muted={this.state.muted} />
                ) : (
                    <Start onClick={() => this.setState({ start: true })}>{Koji.config.general.buttonText}</Start>
                )}
            </Content>
        </Container>
    );
  }
}

export default HomePage;
