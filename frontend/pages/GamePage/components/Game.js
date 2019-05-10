import React from 'react';
import styled from 'styled-components';

import GlobalContext from 'GlobalContext';

import Piece from './Piece';
import Effect from './Effect';
import GameOver from './GameOver';
import BottomBar from './BottomBar';

import Sound from '../helpers/Sound.js';
import Match from '../helpers/Match.js';
import Swap from '../helpers/Swap.js';
import Delete from '../helpers/Delete.js';
import Util from '../helpers/Util.js';

const Pieces = styled.div`
	display: flex;
	align-items: center;
	width: ${({ width }) => width + 8}px;
	height: ${({ height }) => height + 8}px;
    position: relative;
    margin: 0 auto;
    overflow: hidden;
`;

const Container = styled.div`
    width: ${({ width }) => width + 8}px;
    margin: 0 auto;
`;

class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            board: [],
            effects: [],
            score: 0,
            moves: 0,
            multiplier: 1,
            blockSize: 50,
            swipeStart: { x: 0, y: 0 },
            swipeDelta: { x: 0, y: 0 },
            swiping: false,
            pieceSelected: false,
            gameOver: false,
        };

    }

    componentDidMount() {
        this.backgroundMusic = Sound.findAndLoop(this.context.sounds.backgroundMusic, this.props.muted);
        this.swappingSound = Sound.find(this.context.sounds.swappingSound);
        this.matchingSound = Sound.find(this.context.sounds.matchingSound);
        
        // calculate max size for blocks given screen size.
        this.setState({
            blockSize: Util.getBlockSize(this.context.general.width, this.context.general.height),
        });
        
        this.newGame();
    }

    componentWillReceiveProps(newProps) {
        if(this.backgroundMusic) {
            if(newProps.muted && !this.props.muted) {
                this.backgroundMusic.pause();
            } else if(!newProps.muted && this.props.muted) {
                this.backgroundMusic.play();
            }
        }
    }

    newGame() {
        // make a new state of the game at the base start point
        let newBoard = [];
        const numTypes = Util.getNumTypes();
        for(let i=0;i<this.context.general.width;i++) {
            newBoard.push([]);
            for(let j=0;j<this.context.general.height;j++) {
                newBoard[i].push(Util.newElement(numTypes));
            }
        }

        this.setState({
            board: newBoard,
            moves: parseInt(this.context.general.moves),
            score: 0,
            multiplier: 1,
            gameOver: false,
        });
    }
        
    prepMatching(callback) {
        this.setState({
            pieceSelected: undefined,
            busy: true,
            moves: this.state.moves - 1,
            multiplier: 1,
        }, () => callback());
    }

    copy(e) {
        return JSON.parse(JSON.stringify(e));
    }

    checkMatches(target) {
        let newBoard = this.copy(this.state.board);
        
        let found = Match.find(newBoard, [], target);
        found = Match.findPowerups(newBoard, found);

        this.manageAnimation(() => {
            // setup
            newBoard = this.copy(this.state.board);
            newBoard = Match.addPieces(newBoard, found);
            this.setState({ board: newBoard });
        }, () => {
            // animate
            newBoard = this.copy(this.state.board);
            Sound.play(this.matchingSound, this.props.muted);
            this.props.onFlash(Util.getColor(newBoard[found[0].x][found[0].y].type));

            newBoard = Match.mark(newBoard, found, this.context.general.width, this.context.general.height);
            this.collectEffects(newBoard, found);
            this.setState({ board: newBoard });
        }, () => {
            // update dom
            newBoard = this.copy(this.state.board);
            newBoard = Match.sweep(newBoard, this.context.general.width, this.context.general.height);
            // cleaned, reset state then lets run it again
            this.setState({ board: newBoard });
        }, () => {
            // callback
            this.setState({ busy: false, effects: [], gameOver: this.state.moves === 0 });
        });
    }

    pieceClick(x, y) {
        if(this.state.busy) return;

        this.prepMatching(() => this.checkMatches({ x, y }));
    }

    manageAnimation(setup, animationState, finalState, callback) {
        // a function that spaces out all of the different parts of the animation cycle
        // this is needed because sometimes we need transition to be on in the css
        // and sometimes we need it to be off.
        const propagationDelay = 10;
        setup();
        setTimeout(() => {
            this.setState({ animate: true }, () => {
                setTimeout(() => {
                    animationState();
                    setTimeout(() => {
                        this.setState({ animate: false }, () => {
                            setTimeout(() => {
                                finalState();
                                setTimeout(() => callback(), propagationDelay);
                            }, propagationDelay);
                        });
                    }, this.context.general.animationLength);
                }, propagationDelay);
            });
        }, propagationDelay);
    }

    collectEffects(newBoard, marked) {
        let effects = [];
        console.log(marked);
        let newScore = this.state.score;
        marked.forEach((mark) => {
            let amount = this.context.general.baseScore * this.state.multiplier;
            let color = Util.getColor(newBoard[mark.x][mark.y].type);
            effects.push({ x: mark.x, y: mark.y, amount, color });
            newScore += amount; 
        });

        this.setState({ score: newScore, effects: this.state.effects.concat(effects) });
    }

	render() {
		return (
            <Container width={this.context.general.width * this.state.blockSize}>
                <Pieces width={this.context.general.width * this.state.blockSize} height={this.context.general.height * this.state.blockSize}>
                    {this.state.board.map((row, x) => row.map((e, y) => (
                        <Piece
                            key={`(${x},${y})`}
                            type={e.type}
                            selected={e.selected}
                            rowPower={e.rowPower}
                            typePower={e.typePower}
                            deleted={e.deleted}
                            deltaY={e.deltaY}
                            deltaX={e.deltaX}
                            x={x}
                            y={y}
                            size={this.state.blockSize}
                            height={this.context.general.height}
                            animate={this.state.animate}
                            color={Util.getColor(e.type)}
                            image={Util.getImage(e.type)}
                            onClick={() => this.pieceClick(x, y)}
                        />
                    )))}
                    {this.state.effects.map((effect) => (
                        <Effect
                            x={effect.x}
                            y={effect.y}
                            size={this.state.blockSize}
                            color={effect.color}
                        >{effect.amount}</Effect>
                    ))}
                </Pieces>
                <BottomBar
                    size={this.state.blockSize}
                    score={this.state.score}
                    moves={this.state.moves}
                />

                {this.state.gameOver && (
                    <GameOver score={this.state.score} onClose={() => this.newGame()} />
                )}
            </Container>
        );
	}
}

Game.contextType = GlobalContext;

export default Game;
