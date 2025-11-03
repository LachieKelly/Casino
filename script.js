// Casino Royale - Main JavaScript File
class CasinoGame {
    constructor() {
        this.user = {
            name: '',
            avatar: '',
            balance: 500.00
        };
        this.currentGame = null;
        this.avatars = ['🎮', '🎯', '🎲', '🎪', '🎭', '🎨', '🎸', '🎺', '🎻', '🎹', '🎤', '🎧', '🎵', '🎶', '🎼', '🎵'];
        this.lastMessageId = 0;
        this.userBalances = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateAvatars();
        this.showProfileModal();
    }

    setupEventListeners() {
        // Profile setup
        document.getElementById('username').addEventListener('input', this.validateProfile.bind(this));
        document.getElementById('startGame').addEventListener('click', this.startGame.bind(this));
        document.getElementById('changeProfile').addEventListener('click', this.showProfileModal.bind(this));

        // Game selection
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.currentTarget.classList.contains('locked')) {
                    return; // Don't allow clicking on locked games
                }
                this.selectGame(e.currentTarget.dataset.game);
            });
        });

        // Back to menu
        document.getElementById('backToMenu').addEventListener('click', this.backToMenu.bind(this));

    }

    populateAvatars() {
        const avatarGrid = document.getElementById('avatarGrid');
        avatarGrid.innerHTML = '';
        
        this.avatars.forEach((avatar, index) => {
            const avatarOption = document.createElement('div');
            avatarOption.className = 'avatar-option';
            avatarOption.textContent = avatar;
            avatarOption.dataset.avatar = avatar;
            avatarOption.addEventListener('click', () => this.selectAvatar(avatarOption));
            avatarGrid.appendChild(avatarOption);
        });
    }

    selectAvatar(avatarElement) {
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
        });
        avatarElement.classList.add('selected');
        this.user.avatar = avatarElement.dataset.avatar;
        this.validateProfile();
    }

    validateProfile() {
        const username = document.getElementById('username').value.trim();
        const startButton = document.getElementById('startGame');
        
        if (username.length >= 2 && this.user.avatar) {
            this.user.name = username;
            startButton.disabled = false;
        } else {
            startButton.disabled = true;
        }
    }

    showProfileModal() {
        document.getElementById('profileModal').classList.remove('hidden');
        document.getElementById('mainGame').classList.add('hidden');
    }

    async startGame() {
        document.getElementById('profileModal').classList.add('hidden');
        document.getElementById('mainGame').classList.remove('hidden');
        
        // Sync balance with server
        if (this.user.name) {
            const serverBalance = await this.getUserBalance(this.user.name);
            this.user.balance = serverBalance;
        }
        
        this.updateUserDisplay();
    }

    updateUserDisplay() {
        document.getElementById('userName').textContent = this.user.name;
        document.getElementById('userAvatar').textContent = this.user.avatar;
        document.getElementById('walletAmount').textContent = `$${this.user.balance.toFixed(2)}`;
    }

    selectGame(gameType) {
        this.currentGame = gameType;
        document.getElementById('gameArea').classList.remove('hidden');
        document.querySelector('.game-main').classList.add('hidden');
        
        const gameTitle = document.getElementById('currentGameTitle');
        const gameContent = document.getElementById('gameContent');
        
        switch(gameType) {
            case 'roulette':
                gameTitle.textContent = 'Roulette';
                this.loadRouletteGame();
                break;
            case 'horse':
                gameTitle.textContent = 'Horse Racing';
                this.loadHorseGame();
                break;
            case 'blackjack':
                gameTitle.textContent = 'Blackjack';
                this.loadBlackjackGame();
                break;
            case 'slots':
                gameTitle.textContent = 'Slot Machine';
                this.loadSlotGame();
                break;
        }
    }

    backToMenu() {
        document.getElementById('gameArea').classList.add('hidden');
        document.querySelector('.game-main').classList.remove('hidden');
        this.currentGame = null;
    }

    async updateBalance(amount, reason = '') {
        this.user.balance += amount;
        console.log(`Balance updated by ${amount}, new balance: ${this.user.balance}`);
        this.updateUserDisplay();
        
        // Update balance on server
        if (this.user.name) {
            const serverBalance = await this.updateUserBalance(this.user.name, amount);
            // Sync local balance with server balance
            this.user.balance = serverBalance;
            this.updateUserDisplay();
        }
        
        // Send win notification to chat if it's a win and reason is provided
        if (amount > 0 && reason) {
            await this.sendWinNotification(amount, reason);
        }
    }

    canAfford(amount) {
        return this.user.balance >= amount;
    }

    // Roulette Game
    loadRouletteGame() {
        const gameContent = document.getElementById('gameContent');
        gameContent.innerHTML = `
            <div class="game-content">
                <div class="roulette-table">
                    <div class="roulette-wheel-container">
                        <div class="roulette-wheel" id="rouletteWheel">
                            <div class="wheel-center">
                                <div class="wheel-spindle"></div>
                            </div>
                            <div class="wheel-numbers" id="wheelNumbers"></div>
                        </div>
                        <div class="roulette-pointer"></div>
                    </div>
                    
                    <div class="betting-table">
                        <div class="betting-controls">
                            <div class="bet-input-group">
                                <label for="rouletteBet">Bet Amount:</label>
                                <input type="number" id="rouletteBet" min="1" max="${this.user.balance}" value="10">
                            </div>
                            <button class="game-btn spin-btn" id="spinRoulette">SPIN!</button>
                        </div>
                        
                        <div class="betting-grid">
                            <div class="zero-section">
                                <div class="bet-option zero-bet" data-bet="0">0</div>
                            </div>
                            
                            <div class="numbers-grid">
                                <div class="number-row">
                                    <div class="bet-option number-bet red" data-bet="3">3</div>
                                    <div class="bet-option number-bet black" data-bet="6">6</div>
                                    <div class="bet-option number-bet red" data-bet="9">9</div>
                                    <div class="bet-option number-bet red" data-bet="12">12</div>
                                    <div class="bet-option number-bet black" data-bet="15">15</div>
                                    <div class="bet-option number-bet red" data-bet="18">18</div>
                                    <div class="bet-option number-bet red" data-bet="21">21</div>
                                    <div class="bet-option number-bet black" data-bet="24">24</div>
                                    <div class="bet-option number-bet red" data-bet="27">27</div>
                                    <div class="bet-option number-bet red" data-bet="30">30</div>
                                    <div class="bet-option number-bet black" data-bet="33">33</div>
                                    <div class="bet-option number-bet black" data-bet="36">36</div>
                                </div>
                                <div class="number-row">
                                    <div class="bet-option number-bet black" data-bet="2">2</div>
                                    <div class="bet-option number-bet red" data-bet="5">5</div>
                                    <div class="bet-option number-bet black" data-bet="8">8</div>
                                    <div class="bet-option number-bet black" data-bet="11">11</div>
                                    <div class="bet-option number-bet red" data-bet="14">14</div>
                                    <div class="bet-option number-bet black" data-bet="17">17</div>
                                    <div class="bet-option number-bet black" data-bet="20">20</div>
                                    <div class="bet-option number-bet red" data-bet="23">23</div>
                                    <div class="bet-option number-bet black" data-bet="26">26</div>
                                    <div class="bet-option number-bet black" data-bet="29">29</div>
                                    <div class="bet-option number-bet red" data-bet="32">32</div>
                                    <div class="bet-option number-bet red" data-bet="35">35</div>
                                </div>
                                <div class="number-row">
                                    <div class="bet-option number-bet red" data-bet="1">1</div>
                                    <div class="bet-option number-bet black" data-bet="4">4</div>
                                    <div class="bet-option number-bet red" data-bet="7">7</div>
                                    <div class="bet-option number-bet black" data-bet="10">10</div>
                                    <div class="bet-option number-bet black" data-bet="13">13</div>
                                    <div class="bet-option number-bet red" data-bet="16">16</div>
                                    <div class="bet-option number-bet red" data-bet="19">19</div>
                                    <div class="bet-option number-bet black" data-bet="22">22</div>
                                    <div class="bet-option number-bet red" data-bet="25">25</div>
                                    <div class="bet-option number-bet black" data-bet="28">28</div>
                                    <div class="bet-option number-bet black" data-bet="31">31</div>
                                    <div class="bet-option number-bet red" data-bet="34">34</div>
                                </div>
                            </div>
                            
                            <div class="outside-bets">
                                <div class="bet-option outside-bet" data-bet="1-12">1st 12</div>
                                <div class="bet-option outside-bet" data-bet="13-24">2nd 12</div>
                                <div class="bet-option outside-bet" data-bet="25-36">3rd 12</div>
                            </div>
                            
                            <div class="even-money-bets">
                                <div class="bet-option even-bet" data-bet="1-18">1-18</div>
                                <div class="bet-option even-bet" data-bet="even">EVEN</div>
                                <div class="bet-option even-bet red" data-bet="red">RED</div>
                                <div class="bet-option even-bet black" data-bet="black">BLACK</div>
                                <div class="bet-option even-bet" data-bet="odd">ODD</div>
                                <div class="bet-option even-bet" data-bet="19-36">19-36</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="rouletteResult"></div>
            </div>
        `;

        this.setupRouletteEvents();
        this.setupRouletteWheel();
    }

    setupRouletteWheel() {
        const wheelNumbers = document.getElementById('wheelNumbers');
        const numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
        
        numbers.forEach((number, index) => {
            const numberElement = document.createElement('div');
            numberElement.className = 'wheel-number';
            numberElement.textContent = number;
            numberElement.style.transform = `rotate(${index * 9.73}deg) translateY(-80px)`;
            wheelNumbers.appendChild(numberElement);
        });
    }

    setupRouletteEvents() {
        const betOptions = document.querySelectorAll('.bet-option');
        const spinButton = document.getElementById('spinRoulette');
        const betInput = document.getElementById('rouletteBet');
        
        // Add betting controls container if it doesn't exist
        let bettingControls = document.querySelector('.betting-controls');
        if (!bettingControls) {
            bettingControls = document.createElement('div');
            bettingControls.className = 'betting-controls';
            document.querySelector('.roulette-table').insertBefore(bettingControls, document.querySelector('.betting-grid'));
        }
        
        // Add total bets display with styling
        const totalBetsDisplay = document.createElement('div');
        totalBetsDisplay.id = 'totalBetsDisplay';
        totalBetsDisplay.className = 'bets-display';
        totalBetsDisplay.style.backgroundColor = '#1a472a';
        totalBetsDisplay.style.padding = '15px';
        totalBetsDisplay.style.borderRadius = '5px';
        totalBetsDisplay.style.margin = '10px 0';
        totalBetsDisplay.style.fontSize = '1.4em';
        totalBetsDisplay.style.fontWeight = 'bold';
        totalBetsDisplay.style.color = '#00ff00';
        totalBetsDisplay.style.textAlign = 'center';
        totalBetsDisplay.textContent = 'Total Bet: $0';
        bettingControls.insertBefore(totalBetsDisplay, betInput ? betInput.parentElement : null);

        // Store bets with their amounts
        let activeBets = new Map(); // Map of bet type to bet amount
        
        // Add styles for bet amounts on options
        const style = document.createElement('style');
        style.textContent = `
            .bet-amount {
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #00ff00;
                color: black;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.8em;
                font-weight: bold;
                display: none;
            }
            .bet-option {
                position: relative;
            }
        `;
        document.head.appendChild(style);

        betOptions.forEach(option => {
            // Remove any existing bet amount display
            const existingBetAmount = option.querySelector('.bet-amount');
            if (existingBetAmount) {
                existingBetAmount.remove();
            }
            
            // Create new bet amount display
            const betAmount = document.createElement('div');
            betAmount.className = 'bet-amount';
            option.appendChild(betAmount);

            option.addEventListener('click', () => {
                const currentBet = parseFloat(betInput.value);
                
                if (isNaN(currentBet) || currentBet <= 0) {
                    alert('Please enter a valid bet amount!');
                    return;
                }

                if (option.classList.contains('selected')) {
                    // Removing a bet - refund the money
                    const refundAmount = activeBets.get(option.dataset.bet);
                    this.updateBalance(refundAmount);
                    option.classList.remove('selected');
                    activeBets.delete(option.dataset.bet);
                    option.querySelector('.bet-amount').style.display = 'none';
                } else {
                    // Adding a bet - check if user can afford it
                    if (!this.canAfford(currentBet)) {
                        alert('Insufficient funds for this bet!');
                        return;
                    }
                    
                    // Deduct the bet amount immediately
                    this.updateBalance(-currentBet);
                    option.classList.add('selected');
                    activeBets.set(option.dataset.bet, currentBet);
                    
                    // Show bet amount on the option
                    const betAmountDiv = option.querySelector('.bet-amount');
                    betAmountDiv.textContent = `$${currentBet}`;
                    betAmountDiv.style.display = 'block';
                }

                // Update total bets display
                const totalBets = Array.from(activeBets.values()).reduce((sum, bet) => sum + bet, 0);
                totalBetsDisplay.textContent = `Total Bet: $${totalBets}`;
            });
        });

        spinButton.addEventListener('click', () => {
            const selectedBets = document.querySelectorAll('.bet-option.selected');
            const betAmount = parseFloat(betInput.value);

            if (selectedBets.length === 0 || !betAmount || betAmount > this.user.balance) {
                alert('Please select at least one bet and enter a valid amount!');
                return;
            }

            this.spinRoulette(selectedBets, betAmount);
            
            // Reset bets display after spin
            betsDisplay.textContent = 'Bets: 0/9';
        });
    }

    spinRoulette(selectedBets, betAmount) {
        const wheel = document.getElementById('rouletteWheel');
        const resultDiv = document.getElementById('rouletteResult');
        const spinButton = document.getElementById('spinRoulette');
        const totalBetsDisplay = document.getElementById('totalBetsDisplay');

        spinButton.disabled = true;
        wheel.classList.add('spinning');

        // Store the bets before clearing them
        const betsWithAmounts = new Map();
        selectedBets.forEach(bet => {
            const betAmountDiv = bet.querySelector('.bet-amount');
            if (betAmountDiv) {
                betsWithAmounts.set(bet.dataset.bet, parseFloat(betAmountDiv.textContent.replace('$', '')));
            }
        });

        // Clear all selections and reset their styles
        document.querySelectorAll('.bet-option').forEach(option => {
            option.classList.remove('selected');
            option.querySelector('.bet-amount').style.display = 'none';
        });
        
        totalBetsDisplay.textContent = 'Total Bet: $0';

        setTimeout(() => {
            // Generate random number 0-36 (European roulette)
            const winningNumber = Math.floor(Math.random() * 37);
            wheel.classList.remove('spinning');
            
            // Calculate rotation to land on the winning number
            const rotation = this.getNumberRotation(winningNumber);
            wheel.style.transform = `rotate(${rotation}deg)`;
            
            // Check all selected bets
            let totalPayout = 0;
            let winningBets = [];
            let losingBets = [];

            betsWithAmounts.forEach((betAmount, betType) => {
                const won = this.checkRouletteWin(betType, winningNumber);
                
                if (won) {
                    const payout = this.getRoulettePayout(betType, betAmount);
                    totalPayout += payout;
                    winningBets.push({ type: betType, payout: payout });
                } else {
                    losingBets.push(betType);
                }
            });

            if (totalPayout > 0) {
                this.updateBalance(totalPayout, 'Roulette');
                let resultHtml = `<div class="winning">🎉 Winning number: ${winningNumber}! 🎉<br>`;
                winningBets.forEach(bet => {
                    resultHtml += `✅ ${bet.type}: +$${bet.payout.toFixed(2)}<br>`;
                });
                resultHtml += `Total won: $${totalPayout.toFixed(2)}</div>`;
                resultDiv.innerHTML = resultHtml;
            } else {
                resultDiv.innerHTML = `<div class="losing">💸 Winning number: ${winningNumber}. You lost $${betAmount.toFixed(2)}.</div>`;
            }

            // Reset wheel and clear selections
            setTimeout(() => {
                wheel.style.transform = 'rotate(0deg)';
                selectedBets.forEach(bet => bet.classList.remove('selected'));
            }, 3000);

            spinButton.disabled = false;
        }, 3000);
    }

    getNumberRotation(number) {
        // Map numbers to their positions on the wheel (0-36)
        const positions = {
            0: 0, 32: 1, 15: 2, 19: 3, 4: 4, 21: 5, 2: 6, 25: 7, 17: 8, 34: 9, 6: 10, 27: 11, 13: 12, 36: 13, 11: 14, 30: 15, 8: 16, 23: 17, 10: 18, 5: 19, 24: 20, 16: 21, 33: 22, 1: 23, 20: 24, 14: 25, 31: 26, 9: 27, 22: 28, 18: 29, 29: 30, 7: 31, 28: 32, 12: 33, 35: 34, 3: 35, 26: 36
        };
        // Rotate to position the winning number at the top (pointer position)
        return -(positions[number] * 9.73) + 3600; // Add multiple spins for effect
    }


    checkRouletteWin(betType, number) {
        const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
        
        switch(betType) {
            case '0': return number === 0;
            case 'red': return redNumbers.includes(number);
            case 'black': return blackNumbers.includes(number);
            case 'even': return number !== 0 && number % 2 === 0;
            case 'odd': return number % 2 === 1;
            case '1-18': return number >= 1 && number <= 18;
            case '19-36': return number >= 19 && number <= 36;
            case '1-12': return number >= 1 && number <= 12;
            case '13-24': return number >= 13 && number <= 24;
            case '25-36': return number >= 25 && number <= 36;
            default: 
                // Individual number bet
                return parseInt(betType) === number;
        }
    }

    getRoulettePayout(betType, betAmount) {
        const payouts = {
            '0': 36, // Single number
            'red': 1, 'black': 1, 'even': 1, 'odd': 1, '1-18': 1, '19-36': 1, // Even money
            '1-12': 2, '13-24': 2, '25-36': 2 // Dozen bets
        };
        
        // Individual number bets (1-36)
        if (parseInt(betType) >= 1 && parseInt(betType) <= 36) {
            return (betAmount * 36) + betAmount; // 35:1 payout
        }
        
        const multiplier = payouts[betType] || 1;
        return (betAmount * multiplier) + betAmount;
    }

    // Horse Racing Game
    loadHorseGame() {
        const horses = [
            { name: 'Thunder Bolt', icon: '🐎', odds: 2.5, emoji: '🐎' },
            { name: 'Lightning Strike', icon: '⚡', odds: 3.0, emoji: '⚡' },
            { name: 'Storm Chaser', icon: '🌩️', odds: 4.0, emoji: '🌩️' },
            { name: 'Wind Runner', icon: '💨', odds: 5.0, emoji: '💨' }
        ];

        const gameContent = document.getElementById('gameContent');
        gameContent.innerHTML = `
            <div class="game-content">
                <div class="horse-race">
                    <div class="betting-controls">
                        <div class="bet-input-group">
                            <label for="horseBet">Bet Amount:</label>
                            <input type="number" id="horseBet" min="1" max="${this.user.balance}" value="10">
                        </div>
                    </div>
                    <div class="race-status" id="raceStatus">Select a horse and place your bet!</div>
                    <div class="race-track" id="raceTrack">
                        <div class="finish-line"></div>
                        ${horses.map((horse, index) => `
                            <div class="horse-lane" data-horse="${index}">
                                <div class="horse-info">
                                    <div class="horse-icon">${horse.icon}</div>
                                    <div class="horse-name">${horse.name}</div>
                                    <div class="horse-odds">${horse.odds}x</div>
                                </div>
                                <div class="horse-runner" id="horse-${index}" style="left: 20px;">${horse.emoji}</div>
                                <div class="speed-indicator" id="speed-${index}">SPEED BOOST!</div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="game-btn spin-btn" id="startRace">Start Race!</button>
                    <div id="horseResult"></div>
                </div>
            </div>
        `;

        this.setupHorseEvents(horses);
    }

    setupHorseEvents(horses) {
        const horseLanes = document.querySelectorAll('.horse-lane');
        const startButton = document.getElementById('startRace');
        const betInput = document.getElementById('horseBet');

        horseLanes.forEach((lane, index) => {
            lane.addEventListener('click', () => {
                horseLanes.forEach(l => l.classList.remove('selected'));
                lane.classList.add('selected');
            });
        });

        startButton.addEventListener('click', () => {
            const selectedHorse = document.querySelector('.horse-lane.selected');
            const betAmount = parseFloat(betInput.value);

            if (!selectedHorse || !betAmount || betAmount > this.user.balance) {
                alert('Please select a horse and enter a valid bet amount!');
                return;
            }

            this.startHorseRace(selectedHorse.dataset.horse, betAmount, horses);
        });
    }

    startHorseRace(selectedHorseIndex, betAmount, horses) {
        const startButton = document.getElementById('startRace');
        const resultDiv = document.getElementById('horseResult');
        const raceStatus = document.getElementById('raceStatus');
        const trackWidth = document.getElementById('raceTrack').offsetWidth - 60; // Account for finish line

        startButton.disabled = true;
        this.updateBalance(-betAmount);
        raceStatus.textContent = "🏁 RACE IN PROGRESS! 🏁";

        // Reset horse positions and hide names
        horses.forEach((horse, index) => {
            const horseElement = document.getElementById(`horse-${index}`);
            const speedIndicator = document.getElementById(`speed-${index}`);
            const horseInfo = document.querySelector(`#horse-${index}`).parentElement.querySelector('.horse-info');
            
            horseElement.style.left = '20px';
            speedIndicator.classList.remove('show');
            horseInfo.style.opacity = '0'; // Hide horse names during race
        });

        // Initialize race data
        const raceData = horses.map((horse, index) => ({
            position: 20,
            speed: 0.5 + Math.random() * 0.5, // Base speed between 0.5-1.0
            speedBoost: null, // Will be set during race
            hasBoosted: false
        }));

        // Determine speed boost timing for each horse
        horses.forEach((horse, index) => {
            const boostTiming = Math.random();
            if (boostTiming < 0.3) {
                raceData[index].speedBoost = 'start'; // 0-30% of race
            } else if (boostTiming < 0.6) {
                raceData[index].speedBoost = 'middle'; // 30-60% of race
            } else if (boostTiming < 0.8) {
                raceData[index].speedBoost = 'end'; // 60-80% of race
            }
            // 20% chance of no speed boost
        });

        let raceTime = 0;
        const raceDuration = 8000; // 8 seconds
        const updateInterval = 50; // Update every 50ms

        const raceInterval = setInterval(() => {
            raceTime += updateInterval;
            const progress = raceTime / raceDuration;

            horses.forEach((horse, index) => {
                const data = raceData[index];
                let currentSpeed = data.speed;

                // Check for speed boost
                if (data.speedBoost && !data.hasBoosted) {
                    let shouldBoost = false;
                    if (data.speedBoost === 'start' && progress < 0.3) shouldBoost = true;
                    if (data.speedBoost === 'middle' && progress >= 0.3 && progress < 0.6) shouldBoost = true;
                    if (data.speedBoost === 'end' && progress >= 0.6) shouldBoost = true;

                    if (shouldBoost) {
                        currentSpeed *= 2.5; // 2.5x speed boost
                        data.hasBoosted = true;
                        const speedIndicator = document.getElementById(`speed-${index}`);
                        const horseElement = document.getElementById(`horse-${index}`);
                        speedIndicator.classList.add('show');
                        horseElement.classList.add('speed-boost');
                        
                        setTimeout(() => {
                            speedIndicator.classList.remove('show');
                            horseElement.classList.remove('speed-boost');
                        }, 2000);
                    }
                }

                // Add some randomness
                currentSpeed += (Math.random() - 0.5) * 0.3;
                currentSpeed = Math.max(0.1, currentSpeed); // Minimum speed

                // Update position
                data.position += currentSpeed * 3; // Increased speed multiplier
                data.position = Math.min(data.position, trackWidth);

                // Update visual position
                const horseElement = document.getElementById(`horse-${index}`);
                horseElement.style.left = data.position + 'px';
            });

            // Check if any horse has finished
            const finishedHorses = raceData.filter(data => data.position >= trackWidth);
            if (finishedHorses.length > 0) {
                clearInterval(raceInterval);
                this.finishHorseRace(selectedHorseIndex, betAmount, horses, raceData);
                startButton.disabled = false;
            }
        }, updateInterval);
    }

    finishHorseRace(selectedHorseIndex, betAmount, horses, raceData) {
        const resultDiv = document.getElementById('horseResult');
        const raceStatus = document.getElementById('raceStatus');
        
        // Show horse names again
        horses.forEach((horse, index) => {
            const horseInfo = document.querySelector(`#horse-${index}`).parentElement.querySelector('.horse-info');
            horseInfo.style.opacity = '1';
        });
        
        // Sort horses by position to determine finishing order
        const sortedHorses = raceData.map((data, index) => ({
            index: index,
            position: data.position,
            name: horses[index].name,
            odds: horses[index].odds
        })).sort((a, b) => b.position - a.position); // Sort by position (highest first)
        
        const firstPlace = sortedHorses[0];
        const secondPlace = sortedHorses[1];
        const thirdPlace = sortedHorses[2];
        const fourthPlace = sortedHorses[3];
        
        const selectedHorseIndexNum = parseInt(selectedHorseIndex);
        let result = '';
        let payout = 0;
        
        raceStatus.textContent = `🏆 ${firstPlace.name} wins! 🏆`;
        
        if (selectedHorseIndexNum === firstPlace.index) {
            // First place - full payout plus original bet
            payout = (betAmount * firstPlace.odds) + betAmount;
            this.updateBalance(payout, 'Horse Racing - 1st Place');
            result = `
                <div class="winning">
                    🥇 1st Place! ${firstPlace.name} won! You earned $${payout.toFixed(2)}! 🥇
                </div>
            `;
        } else if (selectedHorseIndexNum === secondPlace.index) {
            // Second place - half bet back
            payout = betAmount * 0.5;
            this.updateBalance(payout, 'Horse Racing - 2nd Place');
            result = `
                <div class="winning">
                    🥈 2nd Place! ${secondPlace.name} came in second! You got back $${payout.toFixed(2)}! 🥈
                </div>
            `;
        } else if (selectedHorseIndexNum === thirdPlace.index) {
            // Third place - no loss, no gain (tie) - no money returned
            result = `
                <div>
                    🥉 3rd Place! ${thirdPlace.name} came in third! You broke even! 🥉
                </div>
            `;
        } else {
            // Fourth place - lost
            result = `
                <div class="losing">
                    💸 4th Place! ${horses[selectedHorseIndexNum].name} came in last. You lost $${betAmount.toFixed(2)}.
                </div>
            `;
        }
        
        resultDiv.innerHTML = result;
    }

    // Blackjack Game
    loadBlackjackGame() {
        this.blackjackGame = {
            deck: this.createDeck(),
            playerHand: [],
            dealerHand: [],
            gameOver: false
        };

        const gameContent = document.getElementById('gameContent');
        gameContent.innerHTML = `
            <div class="game-content">
                <div class="blackjack-table">
                    <div class="betting-controls">
                        <div class="bet-input-group">
                            <label for="blackjackBet">Bet Amount:</label>
                            <input type="number" id="blackjackBet" min="1" max="${this.user.balance}" value="10">
                        </div>
                        <button class="game-btn spin-btn" id="dealCards">Deal Cards</button>
                    </div>
                    <div class="hand">
                        <div class="hand-title">Dealer's Hand</div>
                        <div id="dealerHand" class="hand-cards"></div>
                        <div id="dealerValue" class="hand-value"></div>
                    </div>
                    <div class="hand">
                        <div class="hand-title">Your Hand</div>
                        <div id="playerHand" class="hand-cards"></div>
                        <div id="playerValue" class="hand-value"></div>
                    </div>
                    <div class="game-controls" id="gameControls" style="display: none;">
                        <button class="game-btn hit-btn" id="hitButton">Hit</button>
                        <button class="game-btn stand-btn" id="standButton">Stand</button>
                    </div>
                    <div id="blackjackResult"></div>
                </div>
            </div>
        `;

        this.setupBlackjackEvents();
    }

    setupBlackjackEvents() {
        const dealButton = document.getElementById('dealCards');
        const hitButton = document.getElementById('hitButton');
        const standButton = document.getElementById('standButton');

        dealButton.addEventListener('click', () => this.dealBlackjack());
        hitButton.addEventListener('click', () => this.hitBlackjack());
        standButton.addEventListener('click', () => this.standBlackjack());
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];

        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }

        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    dealBlackjack() {
        const betAmount = parseFloat(document.getElementById('blackjackBet').value);
        
        if (!betAmount || betAmount > this.user.balance) {
            alert('Please enter a valid bet amount!');
            return;
        }

        this.blackjackGame = {
            deck: this.createDeck(),
            playerHand: [],
            dealerHand: [],
            gameOver: false,
            betAmount: betAmount
        };

        this.updateBalance(-betAmount);

        // Deal initial cards
        this.blackjackGame.playerHand.push(this.drawCard());
        this.blackjackGame.dealerHand.push(this.drawCard());
        this.blackjackGame.playerHand.push(this.drawCard());
        this.blackjackGame.dealerHand.push(this.drawCard());

        this.updateBlackjackDisplay();
        document.getElementById('gameControls').style.display = 'block';
        document.getElementById('dealCards').style.display = 'none';
    }

    drawCard() {
        return this.blackjackGame.deck.pop();
    }

    getCardValue(card) {
        if (card.value === 'A') return 11;
        if (['J', 'Q', 'K'].includes(card.value)) return 10;
        return parseInt(card.value);
    }

    getHandValue(hand) {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
            if (card.value === 'A') {
                aces++;
                value += 11;
            } else {
                value += this.getCardValue(card);
            }
        }

        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    updateBlackjackDisplay() {
        const playerHandDiv = document.getElementById('playerHand');
        const dealerHandDiv = document.getElementById('dealerHand');
        const playerValueDiv = document.getElementById('playerValue');
        const dealerValueDiv = document.getElementById('dealerValue');

        // Update player hand
        playerHandDiv.innerHTML = this.blackjackGame.playerHand.map(card => 
            `<div class="card ${this.getCardColor(card)}">${card.value}${card.suit}</div>`
        ).join('');
        playerValueDiv.textContent = `Value: ${this.getHandValue(this.blackjackGame.playerHand)}`;

        // Update dealer hand
        if (this.blackjackGame.gameOver) {
            dealerHandDiv.innerHTML = this.blackjackGame.dealerHand.map(card => 
                `<div class="card ${this.getCardColor(card)}">${card.value}${card.suit}</div>`
            ).join('');
            dealerValueDiv.textContent = `Value: ${this.getHandValue(this.blackjackGame.dealerHand)}`;
        } else {
            dealerHandDiv.innerHTML = `
                <div class="card ${this.getCardColor(this.blackjackGame.dealerHand[0])}">${this.blackjackGame.dealerHand[0].value}${this.blackjackGame.dealerHand[0].suit}</div>
                <div class="card">?</div>
            `;
            dealerValueDiv.textContent = `Value: ${this.getCardValue(this.blackjackGame.dealerHand[0])}`;
        }
    }

    getCardColor(card) {
        return ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
    }

    hitBlackjack() {
        if (this.blackjackGame.gameOver) return;

        this.blackjackGame.playerHand.push(this.drawCard());
        this.updateBlackjackDisplay();

        const playerValue = this.getHandValue(this.blackjackGame.playerHand);
        
        if (playerValue > 21) {
            this.endBlackjackGame('bust');
        } else if (playerValue === 21) {
            this.standBlackjack();
        }
    }

    standBlackjack() {
        if (this.blackjackGame.gameOver) return;

        this.blackjackGame.gameOver = true;
        
        // Dealer plays
        while (this.getHandValue(this.blackjackGame.dealerHand) < 17) {
            this.blackjackGame.dealerHand.push(this.drawCard());
        }

        this.updateBlackjackDisplay();
        this.endBlackjackGame('stand');
    }

    endBlackjackGame(result) {
        this.blackjackGame.gameOver = true;
        const playerValue = this.getHandValue(this.blackjackGame.playerHand);
        const dealerValue = this.getHandValue(this.blackjackGame.dealerHand);
        const resultDiv = document.getElementById('blackjackResult');

        let gameResult = '';
        let payout = 0;

        if (result === 'bust') {
            gameResult = 'You busted! Dealer wins.';
        } else if (dealerValue > 21) {
            gameResult = 'Dealer busted! You win!';
            payout = this.blackjackGame.betAmount * 2;
        } else if (playerValue > dealerValue) {
            gameResult = 'You win!';
            payout = this.blackjackGame.betAmount * 2; // This already includes the original bet
        } else if (playerValue < dealerValue) {
            gameResult = 'Dealer wins!';
        } else {
            gameResult = 'Push! It\'s a tie.';
            payout = 0; // No money returned on tie
        }

        if (payout > 0) {
            this.updateBalance(payout, 'Blackjack');
            resultDiv.innerHTML = `<div class="winning">🎉 ${gameResult} You won $${payout.toFixed(2)}! 🎉</div>`;
        } else {
            resultDiv.innerHTML = `<div class="losing">💸 ${gameResult} You lost $${this.blackjackGame.betAmount.toFixed(2)}.</div>`;
        }

        document.getElementById('gameControls').style.display = 'none';
        document.getElementById('dealCards').style.display = 'inline-block';
    }

    // Slot Machine Game
    loadSlotGame() {
        const gameContent = document.getElementById('gameContent');
        gameContent.innerHTML = `
            <div class="game-content">
                <div class="slot-machine">
                    <div class="betting-controls">
                        <div class="bet-input-group">
                            <label for="slotBet">Bet Amount:</label>
                            <input type="number" id="slotBet" min="1" max="${this.user.balance}" value="5">
                        </div>
                    </div>
                    <div class="slot-reels">
                        <div class="slot-reel" id="reel1">🎰</div>
                        <div class="slot-reel" id="reel2">🎰</div>
                        <div class="slot-reel" id="reel3">🎰</div>
                    </div>
                    <div class="slot-lever" id="slotLever">🎰</div>
                    <div id="slotResult"></div>
                </div>
            </div>
        `;

        this.setupSlotEvents();
    }

    setupSlotEvents() {
        const lever = document.getElementById('slotLever');
        const betInput = document.getElementById('slotBet');

        lever.addEventListener('click', () => {
            const betAmount = parseFloat(betInput.value);
            
            if (!betAmount || betAmount > this.user.balance) {
                alert('Please enter a valid bet amount!');
                return;
            }

            this.spinSlots(betAmount);
        });
    }

    spinSlots(betAmount) {
        const reels = ['🎰', '🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
        const lever = document.getElementById('slotLever');
        const resultDiv = document.getElementById('slotResult');

        lever.style.pointerEvents = 'none';
        this.updateBalance(-betAmount);

        // Animate reels
        const reelElements = document.querySelectorAll('.slot-reel');
        let spins = 0;
        const maxSpins = 20;

        const spinInterval = setInterval(() => {
            reelElements.forEach(reel => {
                reel.textContent = reels[Math.floor(Math.random() * reels.length)];
            });
            spins++;

            if (spins >= maxSpins) {
                clearInterval(spinInterval);
                this.checkSlotResult(betAmount, reels);
                lever.style.pointerEvents = 'auto';
            }
        }, 100);
    }

    checkSlotResult(betAmount, reels) {
        const reel1 = document.getElementById('reel1').textContent;
        const reel2 = document.getElementById('reel2').textContent;
        const reel3 = document.getElementById('reel3').textContent;
        const resultDiv = document.getElementById('slotResult');

        let payout = 0;
        let message = '';

        if (reel1 === reel2 && reel2 === reel3) {
            // Three of a kind
            if (reel1 === '7️⃣') {
                payout = (betAmount * 100) + betAmount; // Jackpot! + original bet
                message = `🎰 JACKPOT! Three 7s! You won $${payout.toFixed(2)}! 🎰`;
            } else if (reel1 === '💎') {
                payout = (betAmount * 50) + betAmount;
                message = `💎 Three diamonds! You won $${payout.toFixed(2)}! 💎`;
            } else if (reel1 === '⭐') {
                payout = (betAmount * 25) + betAmount;
                message = `⭐ Three stars! You won $${payout.toFixed(2)}! ⭐`;
            } else {
                payout = (betAmount * 10) + betAmount;
                message = `🎉 Three ${reel1}! You won $${payout.toFixed(2)}! 🎉`;
            }
        } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
            // Two of a kind - only 1/3 of the winnings
            payout = (betAmount * 0.33) + betAmount; // 1/3 winnings + original bet
            message = `🎯 Two of a kind! You won $${payout.toFixed(2)}! 🎯`;
        } else {
            message = `💸 No match. You lost $${betAmount.toFixed(2)}.`;
        }

        if (payout > 0) {
            this.updateBalance(payout, 'Slot Machine');
            resultDiv.innerHTML = `<div class="winning">${message}</div>`;
        } else {
            resultDiv.innerHTML = `<div class="losing">${message}</div>`;
        }
    }


}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CasinoGame();
});
