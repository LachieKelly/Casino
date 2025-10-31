// Casino Royale - Main JavaScript File
class CasinoGame {
	constructor() {
		this.user = {
			name: '',
			avatar: '',
			balance: 500.00
		};
		this.currentGame = null;
		this.avatars = ['🎮', '🎯', '🎲', '🎪', '🎭', '🎨', '🎸', '🎺', '🎻', '🎹', '🎤', '🎧', '🎵', '🎶', '🎼', '💦'];
		this.lastMessageId = 0;
		this.userBalances = {};
		// Track the wheel's cumulative rotation (degrees). This prevents jumps and lets us animate multiple full spins reliably.
		this.currentWheelRotation = 0;
		this.init();
	}

	init() {
		this.setupEventListeners();
		this.populateAvatars();
		this.showProfileModal();

		// Chat polling (removed)
		// this.chatPollingInterval = null;
	}

	setupEventListeners() {
		// Profile setup
		const usernameInput = document.getElementById('username');
		if (usernameInput) usernameInput.addEventListener('input', this.validateProfile.bind(this));
		const startBtn = document.getElementById('startGame');
		if (startBtn) startBtn.addEventListener('click', this.startGame.bind(this));
		const changeProfileBtn = document.getElementById('changeProfile');
		if (changeProfileBtn) changeProfileBtn.addEventListener('click', this.showProfileModal.bind(this));

		// Game selection (delegated) - ensures cards added/modified later still work
		const gamesGrid = document.querySelector('.games-grid');
		if (gamesGrid) {
			gamesGrid.addEventListener('click', (e) => {
				const card = e.target.closest ? e.target.closest('.game-card') : null;
				if (!card) return;
				if (card.classList.contains('locked')) return; // locked
				const game = card.dataset.game;
				if (game) this.selectGame(game);
			});
		}

		// Back to menu
		const backBtn = document.getElementById('backToMenu');
		if (backBtn) backBtn.addEventListener('click', this.backToMenu.bind(this));

		// Note: chat UI removed; no chat event bindings
	}

	populateAvatars() {
		const avatarGrid = document.getElementById('avatarGrid');
		avatarGrid.innerHTML = '';

		this.avatars.forEach((avatar) => {
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

		// Immediately update display so chosen name and avatar show right away
		this.updateUserDisplay();

		// Sync balance with server
		if (this.user.name) {
			const serverBalance = await this.getUserBalance(this.user.name);
			this.user.balance = serverBalance;
			this.updateUserDisplay();
		}
	}

	updateUserDisplay() {
		document.getElementById('userName').textContent = this.user.name;
		document.getElementById('userAvatar').textContent = this.user.avatar || '';
		document.getElementById('walletAmount').textContent = `$${this.user.balance.toFixed(2)}`;
	}

	selectGame(gameType) {
		this.currentGame = gameType;
		document.getElementById('gameArea').classList.remove('hidden');
		document.querySelector('.game-main').classList.add('hidden');

		const gameTitle = document.getElementById('currentGameTitle');
		const gameContent = document.getElementById('gameContent');
		// Clear previous game content to prevent leftover DOM from other games
		gameContent.innerHTML = '';

		switch(gameType) {
			case 'roulette':
				gameTitle.textContent = 'Roulette';
				this.loadRouletteGame();
				break;
			case 'horse':
				gameTitle.textContent = 'Horse Racing';
				this.loadHorseGame();
				break;
			case 'bugs':
				gameTitle.textContent = 'Bug Fights';
				this.loadBugGame();
				break;
			case 'shell':
				gameTitle.textContent = 'Shell Game';
				this.loadShellGame();
				break;
			case 'blackjack':
				gameTitle.textContent = 'Blackjack';
				this.loadBlackjackGame();
				break;
			case 'slots':
				gameTitle.textContent = 'Slot Machine';
				this.loadSlotGame();
				break;
			case 'mines':
				gameTitle.textContent = 'Mines';
				this.loadMinesGame();
				break;
			case 'poker':
				gameTitle.textContent = 'Poker';
				if (typeof this.loadPokerGame === 'function') {
					this.loadPokerGame();
				} else {
					// Fallback UI when the poker loader isn't available (e.g. cached/old script)
					gameContent.innerHTML = `
						<div class="game-content">
							<div class="poker-game">
								<div id="pokerStatus">Poker is not yet available in this build. Try a hard refresh (Cmd+Shift+R) to load the latest scripts.</div>
							</div>
						</div>
					`;
					console.warn('loadPokerGame not found on CasinoGame instance.');
				}
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

		// Removed chat win notification - no chat system
	}

	canAfford(amount) {
		return this.user.balance >= amount;
	}

	// Roulette Game
	loadRouletteGame() {
		const gameContent = document.getElementById('gameContent');
		// Render the betting table (numbers, dozens, even-money) but omit the wheel visual
		gameContent.innerHTML = `
			<div class="game-content">
				<div class="roulette-table">
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
							<div class="bet-option zero-bet" data-bet="00">00</div>
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

					<div id="rouletteSpunText" style="margin-top:1rem;font-size:1.25rem;color:#f5f5dc;">Place a bet and spin the wheel (text-only)</div>
					<div id="rouletteResult" style="margin-top:0.75rem"></div>
				</div>

				<!-- bottom-left victory cue -->
				<div id="rouletteVictory" style="position:fixed;left:12px;bottom:12px;padding:10px 14px;border-radius:8px;background:rgba(0,0,0,0.7);color:#fff;font-weight:700;display:none;z-index:9999;">WIN</div>
			</div>
		`;

		this.setupRouletteEvents();
		// No wheel to setup in text-only mode
		this.setupRouletteWheel();
	}

	setupRouletteWheel() {
		// Wheel removed for text-only mode. Keep function as a no-op so other code can call it safely.
		return;
	}

	setupRouletteEvents() {
		const betOptions = document.querySelectorAll('.bet-option');
		const spinButton = document.getElementById('spinRoulette');
		const betInput = document.getElementById('rouletteBet');
		this.attachNumericFilter(betInput);

		betOptions.forEach(option => {
			option.addEventListener('click', () => {
				// Allow multiple selections for different bet types
				option.classList.toggle('selected');
			});
		});

		spinButton.addEventListener('click', () => {
			const selectedBets = document.querySelectorAll('.bet-option.selected');
			const betAmount = this.getSanitizedBet(betInput);

			if (selectedBets.length === 0 || isNaN(betAmount) || betAmount <= 0 || betAmount > this.user.balance) {
				alert('Please select at least one bet and enter a valid positive amount!');
				return;
			}

			this.spinRoulette(selectedBets, betAmount);
		});
	}

	spinRoulette(selectedBets, betAmount) {
		const resultDiv = document.getElementById('rouletteResult');
		const spinButton = document.getElementById('spinRoulette');
		const spunText = document.getElementById('rouletteSpunText');
		const victory = document.getElementById('rouletteVictory');

		spinButton.disabled = true;
		this.updateBalance(-betAmount);

		// Use American wheel pocket ordering (text-based)
		const numbers = ['0','28','9','26','30','11','7','20','32','17','5','22','34','15','3','24','36','13','1','00','27','10','25','29','12','8','19','31','18','6','21','33','16','4','23','35','14','2'];
		const pockets = numbers.length;

		// Pick a winning pocket randomly
		const winningIndex = Math.floor(Math.random() * pockets);
		const winningPocket = numbers[winningIndex];

		// Simulate a short "spin" delay so UI feels responsive
		const simulatedSpinMs = 900;
		spunText.textContent = 'St...';
		resultDiv.innerHTML = '';

		setTimeout(() => {
			// Show what pocket was spun (text) and compute payouts
			const pocketColor = this.getPocketColor(winningPocket);
			spunText.textContent = `Spun: ${winningPocket} (${pocketColor})`;

			let totalPayout = 0;
			let winningBets = [];

			selectedBets.forEach(bet => {
				const betType = bet.dataset.bet;
				const won = this.checkRouletteWin(betType, winningPocket);
				if (won) {
					const payout = this.getRoulettePayout(betType, betAmount);
					totalPayout += payout;
					winningBets.push({ type: betType, payout: payout });
				}
			});

			if (totalPayout > 0) {
				// Show victory cue bottom-left
				victory.textContent = `+ $${totalPayout.toFixed(2)}`;
				victory.style.background = 'linear-gradient(90deg,#27ae60,#2ecc71)';
				victory.style.display = 'block';

				// Hide victory after a moment
				setTimeout(() => { victory.style.display = 'none'; }, 2500);

				this.updateBalance(totalPayout, 'Roulette');

				let resultHtml = `<div class="winning">🎉 Winning pocket: ${winningPocket} (${pocketColor})! 🎉<br>`;
				winningBets.forEach(bet => { resultHtml += `✅ ${bet.type}: +$${bet.payout.toFixed(2)}<br>`; });
				resultHtml += `Total won: $${totalPayout.toFixed(2)}</div>`;
				resultDiv.innerHTML = resultHtml;
			} else {
				// Show small losing cue bottom-left
				victory.textContent = `- $${betAmount.toFixed(2)}`;
				victory.style.background = 'linear-gradient(90deg,#c0392b,#e74c3c)';
				victory.style.display = 'block';
				setTimeout(() => { victory.style.display = 'none'; }, 1800);

				resultDiv.innerHTML = `<div class="losing">💸 Winning pocket: ${winningPocket} (${pocketColor}). You lost $${betAmount.toFixed(2)}.</div>`;
			}

			// Clear selected bets visually
			selectedBets.forEach(bet => bet.classList.remove('selected'));

			spinButton.disabled = false;
		}, simulatedSpinMs);
	}

	checkRouletteWin(betType, winningPocket) {
		// winningPocket may be '0', '00' or a string number like '17'
		// For red/black checks we need a numeric pocket
		const numeric = parseInt(winningPocket, 10);
		const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
		const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

		switch (betType) {
			case '0': return winningPocket === '0';
			case '00': return winningPocket === '00';
			case 'red': return !isNaN(numeric) && redNumbers.includes(numeric);
			case 'black': return !isNaN(numeric) && blackNumbers.includes(numeric);
			case 'even': return !isNaN(numeric) && numeric % 2 === 0;
			case 'odd': return !isNaN(numeric) && numeric % 2 === 1;
			case '1-18': return !isNaN(numeric) && numeric >= 1 && numeric <= 18;
			case '19-36': return !isNaN(numeric) && numeric >= 19 && numeric <= 36;
			case '1-12': return !isNaN(numeric) && numeric >= 1 && numeric <= 12;
			case '13-24': return !isNaN(numeric) && numeric >= 13 && numeric <= 24;
			case '25-36': return !isNaN(numeric) && numeric >= 25 && numeric <= 36;
			default:
				// Individual number bet (e.g. '17' or '00')
				return String(betType) === String(winningPocket);
		}
	}

	getRoulettePayout(betType, betAmount) {
		// Returns the total payout (including the original stake) for a winning bet
		// Single number payout is 35:1 (returns 36x including original bet)
		const singleNumberMultiplier = 35;
		const payouts = {
			'red': 1, 'black': 1, 'even': 1, 'odd': 1, '1-18': 1, '19-36': 1,
			'1-12': 2, '13-24': 2, '25-36': 2
		};

		if (betType === '0' || betType === '00') {
			return (betAmount * singleNumberMultiplier) + betAmount;
		}

		// Individual numeric string (1-36)
		if (/^\d+$/.test(betType)) {
			const n = parseInt(betType, 10);
			if (n >= 1 && n <= 36) {
				return (betAmount * singleNumberMultiplier) + betAmount;
			}
		}

		const multiplier = payouts[betType] || 1;
		return (betAmount * multiplier) + betAmount;
	}

	// Return pocket color string for a given pocket ('0', '00', or '1'..'36')
	getPocketColor(winningPocket) {
		const numeric = parseInt(winningPocket, 10);
		const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
		const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
		if (winningPocket === '0' || winningPocket === '00') return 'Green';
		if (!isNaN(numeric)) {
			if (redNumbers.includes(numeric)) return 'Red';
			if (blackNumbers.includes(numeric)) return 'Black';
		}
		return 'Unknown';
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
								<!-- comeback indicator removed to avoid visible "COMEBACK" text -->
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
		this.attachNumericFilter(betInput);

		horseLanes.forEach((lane, index) => {
			lane.addEventListener('click', () => {
				horseLanes.forEach(l => l.classList.remove('selected'));
				lane.classList.add('selected');
			});
		});

		startButton.addEventListener('click', () => {
			 const selectedHorse = document.querySelector('.horse-lane.selected');
			 const betAmount = this.getSanitizedBet(betInput);

			if (!selectedHorse || isNaN(betAmount) || betAmount <= 0 || betAmount > this.user.balance) {
				alert('Please select a horse and enter a valid positive bet amount!');
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
			horseElement.classList.remove('comeback');
			horseElement.classList.remove('speed-boost');
		});

		// Initialize race data
		const raceData = horses.map((horse, index) => ({
			position: 20,
			speed: 0.5 + Math.random() * 0.5, // Base speed between 0.5-1.0
			baseSpeed: 0, // will set below
			speedBoost: null, // Will be set during race
			hasBoosted: false,
			comebackAvailable: true,
			hasComeback: false,
			comebackChance: 0.75 // increased chance so comebacks are more common
		}));

		// store base speeds
		raceData.forEach(d => d.baseSpeed = d.speed);

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

		// Only one comeback allowed at a time and add cooldown between comebacks
		let comebackActive = false;
		let lastComebackAt = 0;
		const comebackCooldownMs = 3000; // 3s minimum between comebacks

		const raceInterval = setInterval(() => {
			raceTime += updateInterval;
			const progress = raceTime / raceDuration;

			// compute leader position to check for lagging horses
			const leaderPos = Math.max(...raceData.map(d => d.position));

			// compute current ranking (indices sorted by position desc)
			const ranking = raceData
				.map((d, i) => ({ index: i, pos: d.position }))
				.sort((a, b) => b.pos - a.pos)
				.map(x => x.index);

			horses.forEach((horse, index) => {
				const data = raceData[index];
				let currentSpeed = data.speed;

				// Determine dynamic comeback chance based on current rank (1 = leader)
				const rank = ranking.indexOf(index) + 1; // 1-based
				let effectiveChance = data.comebackChance || 0.1;
				// Make leaders less likely to comeback, trailers more likely
				if (rank === 1) effectiveChance = 0.05;
				else if (rank === 2) effectiveChance = 0.2;
				else if (rank === 3) effectiveChance = 0.6;
				else effectiveChance = 0.85;

				// Comeback mechanic: if a horse is lagging significantly and hasn't used comeback, it has a chance to burst
				const lagThreshold = 40; // reduced threshold so comebacks trigger earlier/more often

				// Only allow triggering if cooldown has passed
				const now = Date.now();
				const canTriggerNow = (now - lastComebackAt) >= comebackCooldownMs;

				if (data.comebackAvailable && !data.hasComeback && !comebackActive && canTriggerNow && (leaderPos - data.position) > lagThreshold) {
					if (Math.random() < effectiveChance) {
						// trigger comeback burst
						data.hasComeback = true;
						data.comebackAvailable = false;
						comebackActive = true; // mark that a comeback is active
						lastComebackAt = now; // record time so next comeback waits
						const horseElement = document.getElementById(`horse-${index}`);

						// Visual cue via runner class only (no visible text)
						horseElement.classList.add('comeback');

						// Make comebacks less powerful than before
						const burstMultiplier = 1.8; // reduced power
						const burstDuration = 1500; // shorter burst (ms)
						const originalSpeed = data.speed;
						data.speed = data.speed * burstMultiplier;

						// Remove burst after burstDuration and slightly reduce base speed to simulate fatigue
						setTimeout(() => {
							data.speed = Math.max(0.12, data.baseSpeed * 0.92);
							horseElement.classList.remove('comeback');
							comebackActive = false; // allow another horse to comeback after cooldown
						}, burstDuration);
					}
				}

				// Check for scheduled speed boost (one per horse)
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

	// Bug Fights Game (text-based battle log)
	loadBugGame() {
		const bugs = [
			{ name: 'Scarlet Stinger', icon: '🐝', odds: 2.0, emoji: '🐝' },
			{ name: 'Rock Beetle', icon: '🐞', odds: 3.0, emoji: '🐞' },
			{ name: 'Spiky Ant', icon: '🐜', odds: 4.0, emoji: '🐜' },
			{ name: 'Striped Mantis', icon: '🦗', odds: 5.0, emoji: '🦗' }
		];

		const gameContent = document.getElementById('gameContent');
		gameContent.innerHTML = `
			<div class="game-content">
				<div class="bug-fight">
					<div class="betting-controls">
						<div class="bet-input-group">
							<label for="bugBet">Bet Amount:</label>
							<input type="number" id="bugBet" min="1" max="${this.user.balance}" value="5">
						</div>
					</div>

					<div class="bug-options" id="bugOptions" style="display:flex;gap:1rem;margin:1rem 0;flex-wrap:wrap;">
						${bugs.map((bug, index) => `
							<div class="bug-option" data-bug="${index}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;cursor:pointer;">
								<div class="bug-icon" style="font-size:1.5rem;">${bug.icon}</div>
								<div class="bug-name" style="font-weight:700;">${bug.name}</div>
								<div class="bug-odds" style="font-size:0.9rem;color:#bbb;">${bug.odds}x</div>
							</div>
						`).join('')}
					</div>

					<div id="bugBattleLog" style="background:#111;padding:12px;border-radius:8px;color:#f5f5dc;height:160px;overflow:auto;font-family:monospace;font-size:0.95rem;">Select a bug and start the fight to see the battle log.</div>

					<div style="margin-top:0.75rem;display:flex;gap:12px;align-items:center;">
						<button class="game-btn" id="startBugs">Start Fight!</button>
						<div id="bugResult" style="flex:1"></div>
					</div>
				</div>
			</div>
		`;

		// Attach events
		this.setupBugEvents(bugs);
	}

	setupBugEvents(bugs) {
		const bugContainer = document.getElementById('bugOptions');
		const startButton = document.getElementById('startBugs');
		const betInput = document.getElementById('bugBet');
		this.attachNumericFilter(betInput);

		// Delegate click so newly created options are handled
		bugContainer.addEventListener('click', (e) => {
			const card = e.target.closest ? e.target.closest('.bug-option') : null;
			if (!card) return;
			// Ignore clicks on dead bugs
			if (card.dataset.dead === 'true' || card.classList.contains('dead')) return;

			// Clear previous selection visuals
			document.querySelectorAll('.bug-option').forEach(o => o.classList.remove('selected'));

			// Apply selected class to chosen card
			card.classList.add('selected');
		});

		startButton.addEventListener('click', () => {
			const selected = document.querySelector('.bug-option.selected');
			const betAmount = this.getSanitizedBet(betInput);

			if (!selected || isNaN(betAmount) || betAmount <= 0 || betAmount > this.user.balance) {
				alert('Please select a bug and enter a valid positive bet amount!');
				return;
			}

			this.startBugFight(selected.dataset.bug, betAmount, bugs);
		});
	}

	startBugFight(selectedBugIndex, betAmount, bugs) {
		const startButton = document.getElementById('startBugs');
		const resultDiv = document.getElementById('bugResult');
		const battleLog = document.getElementById('bugBattleLog');

		startButton.disabled = true;
		resultDiv.innerHTML = '';
		battleLog.innerHTML = '';
		this.updateBalance(-betAmount);

		// Compute winner probabilities (lower odds = higher chance)
		const weights = bugs.map(b => 1 / b.odds);
		const totalWeight = weights.reduce((s, w) => s + w, 0);
		let r = Math.random() * totalWeight;
		let winner = 0;
		for (let i = 0; i < weights.length; i++) {
			r -= weights[i];
			if (r <= 0) { winner = i; break; }
		}

		// Event phrases
		const actions = [
			'dashes forward', 'lands a heavy strike', 'dodges nimbly', 'counterattacks', 'finds an opening', 'stumbles', 'blocks the assault', 'pushes back', 'gets pinned briefly', 'erupts in a fury'
		];

		// Order of deaths (shuffle non-winners)
		const nonWinners = bugs.map((b, idx) => idx).filter(i => i !== winner);
		for (let i = nonWinners.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[nonWinners[i], nonWinners[j]] = [nonWinners[j], nonWinners[i]];
		}

		const alive = bugs.map(() => true);

		const appendLog = (text) => {
			const line = document.createElement('div');
			line.textContent = text;
			battleLog.appendChild(line);
			battleLog.scrollTop = battleLog.scrollHeight;
		};

		appendLog('⚔️ The battle begins! ⚔️');

		// Slower pacing so messages are easier to read
		const intervalDelay = 1800; // 1.8s between messages
		let step = 0;
		let nextKillIndex = 0;
		const steps = 6 + Math.floor(Math.random() * 4); // base event count
		const deathStart = Math.max(2, Math.floor(steps / 2));

		const interval = setInterval(() => {
			// Stage wound -> death for each non-winner starting at deathStart
			if (step >= deathStart && nextKillIndex < nonWinners.length) {
				const toKill = nonWinners[nextKillIndex];
				appendLog(`${bugs[toKill].icon} ${bugs[toKill].name} is critically wounded...`);

				// After half the delay, show death and mark dead
				setTimeout(() => {
					appendLog(`💀 ${bugs[toKill].icon} ${bugs[toKill].name} has died.`);
					alive[toKill] = false;
					const cardEl = document.querySelector(`.bug-option[data-bug="${toKill}"]`);
					if (cardEl) {
						cardEl.classList.add('dead');
						cardEl.dataset.dead = 'true';
						cardEl.classList.remove('selected');
					}
					nextKillIndex++;
				}, Math.floor(intervalDelay / 2));

				step++;
				// If that was the last non-winner, finish early
				if (nextKillIndex >= nonWinners.length) {
					clearInterval(interval);
					setTimeout(() => finishSequence(), 900);
				}
				return;
			}

			// Regular flavoured event between alive bugs
			if (step < steps) {
				const aliveIndices = bugs.map((b,i) => i).filter(i => alive[i]);
				if (aliveIndices.length <= 1) {
					clearInterval(interval);
					setTimeout(() => finishSequence(), 300);
					return;
				}
				const actor = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
				let target = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
				const action = actions[Math.floor(Math.random() * actions.length)];
				if (actor === target) appendLog(`${bugs[actor].icon} ${bugs[actor].name} ${action}.`);
				else appendLog(`${bugs[actor].icon} ${bugs[actor].name} ${action} at ${bugs[target].icon} ${bugs[target].name}.`);
				step++;
			} else {
				clearInterval(interval);
				setTimeout(() => finishSequence(), 600);
			}
		}, intervalDelay);

		const finishSequence = () => {
			// Ensure all non-winners are dead
			for (let i = nextKillIndex; i < nonWinners.length; i++) {
				const toKill = nonWinners[i];
				if (alive[toKill]) {
					appendLog(`💀 ${bugs[toKill].icon} ${bugs[toKill].name} has died.`);
					alive[toKill] = false;
					const cardEl = document.querySelector(`.bug-option[data-bug="${toKill}"]`);
					if (cardEl) {
						cardEl.classList.add('dead');
						cardEl.dataset.dead = 'true';
						cardEl.classList.remove('selected');
					}
				}
			}

			appendLog('\n🏁 The battle ends!');
			appendLog(`🏆 Winner: ${bugs[winner].icon} ${bugs[winner].name} 🏆`);

			// Payout
			const winnerNum = parseInt(winner, 10);
			if (parseInt(selectedBugIndex, 10) === winnerNum) {
				const payout = (betAmount * bugs[winnerNum].odds) + betAmount;
				this.updateBalance(payout, 'Bug Fights - Win');
				resultDiv.innerHTML = `<div class="winning">🥇 ${bugs[winnerNum].name} won! You earned $${payout.toFixed(2)}!</div>`;
			} else {
				resultDiv.innerHTML = `<div class="losing">💸 ${bugs[parseInt(selectedBugIndex,10)].name} lost. You lost $${betAmount.toFixed(2)}.</div>`;
			}

			// Clean up selection visuals but leave dead styling
			document.querySelectorAll('.bug-option').forEach(o => o.classList.remove('selected'));

			startButton.disabled = false;
		};
	}

	// Blackjack Game (recreated)
	loadBlackjackGame() {
		// initialize game state
		this.blackjackGame = {
			deck: this.createDeck(),
			playerHand: [],
			dealerHand: [],
			betAmount: 0,
			gameOver: false
		};

		const gameContent = document.getElementById('gameContent');
		// Ensure game area visible
		document.getElementById('gameArea').classList.remove('hidden');
		const mainGame = document.querySelector('.game-main');
		if (mainGame) mainGame.classList.add('hidden');

		gameContent.innerHTML = `
			<div class="game-content">
				<div class="blackjack-table">
					<div class="betting-controls">
						<div class="bet-input-group">
							<label for="blackjackBet">Bet Amount:</label>
							<input type="number" id="blackjackBet" min="1" max="${this.user.balance}" value="10">
						</div>
						<button class="game-btn spin-btn" id="dealCards">Deal</button>
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

					<div class="game-controls" id="gameControls" style="display:none;">
						<button class="game-btn hit-btn" id="hitButton">Hit</button>
						<button class="game-btn stand-btn" id="standButton">Stand</button>
					</div>

					<div id="blackjackResult"></div>
				</div>
			</div>
		`;

		// Attach numeric filter to bet input
		const betInput = document.getElementById('blackjackBet');
		this.attachNumericFilter(betInput);

		// Wire up buttons
		this.setupBlackjackEvents();
	}

	setupBlackjackEvents() {
		const dealButton = document.getElementById('dealCards');
		const hitButton = document.getElementById('hitButton');
		const standButton = document.getElementById('standButton');

		if (dealButton) dealButton.addEventListener('click', () => this.dealBlackjack());
		if (hitButton) hitButton.addEventListener('click', () => this.hitBlackjack());
		if (standButton) standButton.addEventListener('click', () => this.standBlackjack());
	}

	createDeck() {
		const suits = ['♠', '♥', '♦', '♣'];
		const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
		const deck = [];
		for (let suit of suits) for (let value of values) deck.push({ suit, value });
		return this.shuffleDeck(deck);
	}

	shuffleDeck(deck) {
		for (let i = deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[deck[i], deck[j]] = [deck[j], deck[i]];
		}
		return deck;
	}

	drawCard() {
		// Ensure deck exists
		if (!this.blackjackGame || !this.blackjackGame.deck) return null;
		if (this.blackjackGame.deck.length === 0) this.blackjackGame.deck = this.createDeck();
		return this.blackjackGame.deck.pop();
	}

	getCardValue(card) {
		if (!card) return 0;
		if (card.value === 'A') return 11;
		if (['J','Q','K'].includes(card.value)) return 10;
		return parseInt(card.value, 10);
	}

	getHandValue(hand) {
		let value = 0, aces = 0;
		for (const card of hand) {
			if (card.value === 'A') { aces++; value += 11; }
			else value += this.getCardValue(card);
		}
		while (value > 21 && aces > 0) { value -= 10; aces--; }
		return value;
	}

	updateBlackjackDisplay() {
		const playerHandDiv = document.getElementById('playerHand');
		const dealerHandDiv = document.getElementById('dealerHand');
		const playerValueDiv = document.getElementById('playerValue');
		const dealerValueDiv = document.getElementById('dealerValue');

		if (!this.blackjackGame) return;

		playerHandDiv.innerHTML = this.blackjackGame.playerHand.map(card => `<div class="card ${this.getCardColor(card)}">${card.value}${card.suit}</div>`).join('');
		playerValueDiv.textContent = `Value: ${this.getHandValue(this.blackjackGame.playerHand)}`;

		// Dealer shows one card if game not over
		if (this.blackjackGame.gameOver) {
			dealerHandDiv.innerHTML = this.blackjackGame.dealerHand.map(card => `<div class="card ${this.getCardColor(card)}">${card.value}${card.suit}</div>`).join('');
			dealerValueDiv.textContent = `Value: ${this.getHandValue(this.blackjackGame.dealerHand)}`;
		} else {
			if (this.blackjackGame.dealerHand.length > 0) {
				const first = this.blackjackGame.dealerHand[0];
				dealerHandDiv.innerHTML = `<div class="card ${this.getCardColor(first)}">${first.value}${first.suit}</div><div class="card">?</div>`;
				dealerValueDiv.textContent = `Value: ${this.getCardValue(first)}`;
			} else {
				dealerHandDiv.innerHTML = '';
				dealerValueDiv.textContent = '';
			}
		}
	}

	getCardColor(card) {
		return ['♥','♦'].includes(card.suit) ? 'red' : 'black';
	}

	dealBlackjack() {
		const betInput = document.getElementById('blackjackBet');
		this.attachNumericFilter(betInput);
		const betAmount = this.getSanitizedBet(betInput);
		if (isNaN(betAmount) || betAmount <= 0 || betAmount > this.user.balance) {
			alert('Please enter a valid positive bet amount!');
			return;
		}

		// reset hands
		this.blackjackGame.deck = this.createDeck();
		this.blackjackGame.playerHand = [];
		this.blackjackGame.dealerHand = [];
		this.blackjackGame.betAmount = betAmount;
		this.blackjackGame.gameOver = false;

		// deduct bet
		this.updateBalance(-betAmount);

		// initial deal
		this.blackjackGame.playerHand.push(this.drawCard());
		this.blackjackGame.dealerHand.push(this.drawCard());
		this.blackjackGame.playerHand.push(this.drawCard());
		this.blackjackGame.dealerHand.push(this.drawCard());

		// update UI
		document.getElementById('gameControls').style.display = 'block';
		document.getElementById('dealCards').style.display = 'none';
		document.getElementById('blackjackResult').innerHTML = '';
		this.updateBlackjackDisplay();

		// auto-check for naturals
		const playerValue = this.getHandValue(this.blackjackGame.playerHand);
		const dealerValue = this.getHandValue(this.blackjackGame.dealerHand);
		if (playerValue === 21 || dealerValue === 21) {
			this.standBlackjack();
		}
	}

	hitBlackjack() {
		if (!this.blackjackGame || this.blackjackGame.gameOver) return;
		this.blackjackGame.playerHand.push(this.drawCard());
		this.updateBlackjackDisplay();
		const playerValue = this.getHandValue(this.blackjackGame.playerHand);
		if (playerValue > 21) this.endBlackjackGame('bust');
		else if (playerValue === 21) this.standBlackjack();
	}

	standBlackjack() {
		if (!this.blackjackGame || this.blackjackGame.gameOver) return;
		this.blackjackGame.gameOver = true;

		// dealer draws to 17
		while (this.getHandValue(this.blackjackGame.dealerHand) < 17) {
			this.blackjackGame.dealerHand.push(this.drawCard());
		}

		this.updateBlackjackDisplay();
		this.endBlackjackGame('stand');
	}

	endBlackjackGame(result) {
		if (!this.blackjackGame) return;
		this.blackjackGame.gameOver = true;
		const playerValue = this.getHandValue(this.blackjackGame.playerHand);
		const dealerValue = this.getHandValue(this.blackjackGame.dealerHand);
		const resultDiv = document.getElementById('blackjackResult');

		let message = '';
		let payout = 0;

		if (result === 'bust') {
			message = 'You busted! Dealer wins.';
		} else if (dealerValue > 21) {
			message = 'Dealer busted! You win!';
			payout = this.blackjackGame.betAmount * 2;
		} else if (playerValue > dealerValue) {
			message = 'You win!';
			payout = this.blackjackGame.betAmount * 2;
		} else if (playerValue < dealerValue) {
			message = 'Dealer wins!';
		} else {
			message = 'Push! It\'s a tie.';
			payout = this.blackjackGame.betAmount; // refund
		}

		// show full dealer hand and result
		this.updateBlackjackDisplay();

		if (payout > 0) {
			this.updateBalance(payout, 'Blackjack');
			if (payout === this.blackjackGame.betAmount) {
				resultDiv.innerHTML = `<div class="winning">🤝 ${message} Your bet of $${this.blackjackGame.betAmount.toFixed(2)} has been returned.</div>`;
			} else {
				resultDiv.innerHTML = `<div class="winning">🎉 ${message} You won $${payout.toFixed(2)}! 🎉</div>`;
			}
		} else {
			resultDiv.innerHTML = `<div class="losing">💸 ${message} You lost $${this.blackjackGame.betAmount.toFixed(2)}.</div>`;
		}

		// reset controls
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

	// New: Shell Game
	loadShellGame() {
		const gameContent = document.getElementById('gameContent');
		gameContent.innerHTML = `
			<div class="game-content">
				<div class="shell-game">
					<div class="betting-controls">
						<div class="bet-input-group">
							<label for="shellBet">Bet Amount:</label>
							<input type="number" id="shellBet" min="1" max="${this.user.balance}" value="5">
						</div>
						<div style="margin-top:8px;display:flex;gap:8px;align-items:center;justify-content:center;">
							<label style="font-weight:700;color:#f5f5dc;">Difficulty:</label>
							<div id="shellDifficulties" style="display:flex;gap:6px;">
								<button class="game-btn diff-btn" data-mult="2">2x</button>
								<button class="game-btn diff-btn selected" data-mult="3">3x</button>
								<button class="game-btn diff-btn" data-mult="4">4x</button>
								<button class="game-btn diff-btn" data-mult="5">5x</button>
							</div>
						</div>
					</div>

					<div id="shellStatus" style="margin:0.75rem 0;font-weight:700;color:#f5f5dc;">Pick a cup or press Play to watch the shuffle.</div>

					<div id="shellBoard" style="position:relative;height:160px;margin:0 auto 1rem;max-width:460px;">
						<!-- cups will be injected here -->
					</div>

					<div style="display:flex;gap:12px;align-items:center;justify-content:center;">
						<button class="game-btn" id="playShell">Play</button>
						<div id="shellResult" style="flex:1"></div>
					</div>
				</div>
			</div>
		`;

		// Build 3 cups and inject
		const board = document.getElementById('shellBoard');
		const positions = [20, 180, 340];
		for (let i = 0; i < 3; i++) {
			const cup = document.createElement('div');
			cup.className = 'cup';
			cup.dataset.cup = i;
			cup.style.position = 'absolute';
			cup.style.left = positions[i] + 'px';
			cup.style.top = '20px';
			cup.style.width = '120px';
			cup.style.height = '120px';
			cup.style.borderRadius = '12px';
			cup.style.display = 'flex';
			cup.style.alignItems = 'center';
			cup.style.justifyContent = 'center';
			cup.style.flexDirection = 'column';
			cup.style.background = 'linear-gradient(180deg,#3a5a40,#2e6f3f)';
			cup.style.cursor = 'pointer';
			cup.style.transition = 'left 350ms ease, transform 200ms ease, opacity 200ms ease';

			cup.innerHTML = `
				<div class="cup-top" style="font-size:2.2rem;">🧉</div>
				<div class="ball" style="margin-top:8px;display:none;font-size:1.6rem;">⚪</div>
			`;
			board.appendChild(cup);
		}

		this.setupShellEvents();
	}

	setupShellEvents() {
		const playBtn = document.getElementById('playShell');
		const betInput = document.getElementById('shellBet');
		this.attachNumericFilter(betInput);

		// Difficulty buttons
		const diffButtons = Array.from(document.querySelectorAll('#shellDifficulties .diff-btn'));
		diffButtons.forEach(btn => {
			btn.addEventListener('click', (e) => {
				diffButtons.forEach(b => b.classList.remove('selected'));
				e.currentTarget.classList.add('selected');
			});
		});

		playBtn.addEventListener('click', () => {
			const betAmount = this.getSanitizedBet(betInput);
			if (isNaN(betAmount) || betAmount <= 0 || betAmount > this.user.balance) {
				alert('Please enter a valid positive bet amount!');
				return;
			}

			// Determine selected difficulty multiplier
			const sel = document.querySelector('#shellDifficulties .diff-btn.selected');
			const multiplier = sel ? parseInt(sel.dataset.mult, 10) : 3;

			this.startShellGame(betAmount, multiplier);
		});
	}

	startShellGame(betAmount, multiplier = 3) {
		const playBtn = document.getElementById('playShell');
		const resultDiv = document.getElementById('shellResult');
		const status = document.getElementById('shellStatus');
		const board = document.getElementById('shellBoard');
		const cups = Array.from(board.querySelectorAll('.cup'));

		// Basic state
		const slots = [20, 180, 340];
		let canPick = false;
		let winnerCupIndex = Math.floor(Math.random() * cups.length); // which cup (element index) initially has the ball

		// Reset visuals
		resultDiv.innerHTML = '';
		status.textContent = 'Watch closely!';
		cups.forEach((c, i) => {
			c.classList.remove('revealed');
			c.classList.remove('dead');
			c.style.opacity = '1';
			const ball = c.querySelector('.ball');
			if (ball) ball.style.display = (i === winnerCupIndex) ? 'block' : 'none';
			// reset positions
			c.style.left = slots[i] + 'px';
			c.dataset.pos = i; // track current slot index
			// ensure no lingering click handlers
			c.style.pointerEvents = 'none';
		});

		// Deduct bet now
		this.updateBalance(-betAmount);
		playBtn.disabled = true;

		// Difficulty -> duration mapping (ms)
		const durationMap = { 2: 6000, 3: 12000, 4: 20000, 5: 30000 };
		const totalDuration = durationMap[multiplier] || 12000;
		const shuffleDelay = 400; // ms per swap animation
		const shuffleCount = Math.max(6, Math.ceil(totalDuration / shuffleDelay));

		let shufflesDone = 0;
		const cupToSlot = [0,1,2];

		// Show the ball briefly before the shuffle starts, then hide while cups move
		const initialPeekMs = 800; // milliseconds to show ball before movement
		setTimeout(() => {
			// hide balls right before shuffling begins
			cups.forEach(c => { const b = c.querySelector('.ball'); if (b) b.style.display = 'none'; });

			const shuffleInterval = setInterval(() => {
				if (shufflesDone >= shuffleCount) {
					clearInterval(shuffleInterval);
					// finished shuffling; allow player to pick
					canPick = true;
					status.textContent = 'Pick the cup with the ball!';
					// wire click handlers (one-time)
					cups.forEach((c, idx) => {
						c.style.pointerEvents = 'auto';
						c.addEventListener('click', (e) => {
							if (!canPick) return;
							canPick = false;
							// determine which cup element was clicked (element index)
							const clickedIndex = parseInt(e.currentTarget.dataset.cup, 10);
							this.onShellCupClick(e.currentTarget, winnerCupIndex, betAmount, multiplier, resultDiv, status, cups);
						}, { once: true });
					});
					return;
				}

				shufflesDone++;

				// pick two distinct cups to swap positions
				let i = Math.floor(Math.random() * 3);
				let j = Math.floor(Math.random() * 3);
				while (j === i) j = Math.floor(Math.random() * 3);

				// swap their slot indices in mapping
				[cupToSlot[i], cupToSlot[j]] = [cupToSlot[j], cupToSlot[i]];

				// animate the swap
				cups[i].style.left = slots[cupToSlot[i]] + 'px';
				cups[j].style.left = slots[cupToSlot[j]] + 'px';

				// update dataset.pos so elements know their current slot
				cups[i].dataset.pos = cupToSlot[i];
				cups[j].dataset.pos = cupToSlot[j];

				// NOTE: winnerCupIndex is the element index that originally had the ball
				// Do NOT change winnerCupIndex when swapping element positions — the ball stays with the element.
			}, shuffleDelay);
		}, initialPeekMs);
	}

	onShellCupClick(cup, winnerElementIndex, betAmount, multiplier, resultDiv, status, cups) {
		// Use element index for comparison
		const selectedIndex = parseInt(cup.dataset.cup, 10);

		// Reveal the selected cup visually
		cup.classList.add('revealed');

		// Determine if player won
		const won = (selectedIndex === winnerElementIndex);

		if (won) {
			// show ball under selected cup (it is the winner element)
			const ball = cup.querySelector('.ball');
			if (ball) ball.style.display = 'block';

			const payout = betAmount * multiplier; // use selected difficulty multiplier
			this.updateBalance(payout, 'Shell Game');
			resultDiv.innerHTML = `<div class="winning">🎉 You found the ball! You win $${payout.toFixed(2)}! 🎉</div>`;
		} else {
			// do NOT show a ball under the wrong chosen cup; reveal only winner later
			resultDiv.innerHTML = `<div class="losing">💸 Sorry, the ball was under another cup. You lost $${betAmount.toFixed(2)}.</div>`;
		}

		// Show the winning cup briefly before resetting
		const winCup = cups[winnerElementIndex];
		if (winCup) {
			winCup.classList.add('revealed');
			const winBall = winCup.querySelector('.ball');
			if (winBall) winBall.style.display = 'block';
		}

		setTimeout(() => {
			cups.forEach(c => {
				c.classList.remove('revealed');
				const b = c.querySelector('.ball');
				if (b) b.style.display = 'none';
				c.style.pointerEvents = 'auto';
			});
			status.textContent = 'Pick a cup or press Play to watch the shuffle.';
			resultDiv.innerHTML = '';
			const playBtn = document.getElementById('playShell');
			if (playBtn) playBtn.disabled = false;
		}, 4000);
	}

	// Mines Game
	loadMinesGame() {
		const gameContent = document.getElementById('gameContent');
		gameContent.innerHTML = `
			<div class="game-content">
				<div class="mines-game">
					<div class="betting-controls">
						<div class="bet-input-group">
							<label for="minesBet">Bet Amount:</label>
							<input type="number" id="minesBet" min="1" max="${this.user.balance}" value="5">
						</div>
						<div class="mines-controls">
							<div style="font-weight:700;color:#f5f5dc;">Grid: 5x5 | Bombs: 1</div>
							<button class="game-btn" id="startMines">Start</button>
						</div>
					</div>
					<div id="minesStatus">Place a bet and start the game.</div>
					<div id="minesGrid" class="mines-grid"></div>
					<div id="minesResult"></div>
				</div>
			</div>
		`;

		this.setupMinesEvents();
	}

	setupMinesEvents() {
		const startBtn = document.getElementById('startMines');
		if (startBtn) startBtn.addEventListener('click', () => this.startMinesGame());
	}

	startMinesGame() {
		const betInput = document.getElementById('minesBet');
		this.attachNumericFilter(betInput);
		const betAmount = this.getSanitizedBet(betInput);
		const size = 5; // fixed 5x5
		const bombs = 1; // fixed 1 bomb

		if (isNaN(betAmount) || betAmount <= 0 || betAmount > this.user.balance) {
			alert('Please enter a valid positive bet amount!');
			return;
		}

		if (bombs >= size * size) {
			alert('Too many bombs for the selected grid size.');
			return;
		}

		// Initialize game state
		this.minesGame = {
			size: size,
			bombs: bombs,
			bet: betAmount,
			revealed: 0,
			totalSafe: size * size - bombs,
			grid: [],
			gameOver: false,
			awardedRows: new Set(),
			awardedCols: new Set()
		};

		// Deduct bet immediately
		this.updateBalance(-betAmount);

		// Build grid with unique cell objects
		const grid = Array.from({ length: size }, () =>
			Array.from({ length: size }, () => ({ isBomb: false, revealed: false }))
		);

		// Place bombs randomly
		let placed = 0;
		while (placed < bombs) {
			const r = Math.floor(Math.random() * size);
			const c = Math.floor(Math.random() * size);
			if (!grid[r][c].isBomb) {
				grid[r][c].isBomb = true;
				placed++;
			}
		}
		this.minesGame.grid = grid;

		// Render grid
		const gridDiv = document.getElementById('minesGrid');
		gridDiv.innerHTML = '';
		gridDiv.style.gridTemplateColumns = `repeat(${size}, 80px)`;
		gridDiv.classList.add('active');

		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				const cell = document.createElement('div');
				cell.className = 'mine-cell';
				cell.dataset.r = r;
				cell.dataset.c = c;
				cell.textContent = '';
				cell.addEventListener('click', (e) => this.revealMineCell(e.currentTarget));
				gridDiv.appendChild(cell);
			}
		}

		document.getElementById('minesStatus').textContent = `Click squares to find gems. Avoid bombs! Safe to reveal: ${this.minesGame.totalSafe}.`;
		document.getElementById('minesResult').innerHTML = '';
	}

	revealMineCell(cellElement) {
		if (!this.minesGame || this.minesGame.gameOver) return;

		const r = parseInt(cellElement.dataset.r);
		const c = parseInt(cellElement.dataset.c);
		const cellData = this.minesGame.grid[r][c];

		if (cellData.revealed) return; // already revealed

		cellData.revealed = true;
		cellElement.classList.add('revealed');

		if (cellData.isBomb) {
			cellElement.textContent = '💣';
			cellElement.classList.add('bomb');
			this.endMinesGame(false);
			return;
		} else {
					// Show gem emoji
			cellElement.textContent = '💎';
			this.minesGame.revealed++;

			// Check for full row cleared
			const size = this.minesGame.size;
			const bet = this.minesGame.bet;
			// Row check
			let rowCleared = true;
			for (let cc = 0; cc < size; cc++) {
				if (!this.minesGame.grid[r][cc].revealed) { rowCleared = false; break; }
			}
			if (rowCleared && !this.minesGame.awardedRows.has(r)) {
				const award = bet * 0.08;
				this.updateBalance(award, 'Mines Row Cleared');
				this.minesGame.awardedRows.add(r);
				const status = document.getElementById('minesStatus');
				status.textContent = `Row ${r+1} cleared! You earned $${award.toFixed(2)}.`;

				// Temporary notification in minesResult
				const resultDiv = document.getElementById('minesResult');
				const note = document.createElement('div');
				note.className = 'mines-msg';
				note.textContent = `Row ${r+1} cleared: +$${award.toFixed(2)}`;
				resultDiv.appendChild(note);
				setTimeout(() => { if (note.parentElement) note.remove(); }, 4000);
			}

			// Column check
			let colCleared = true;
			for (let rr = 0; rr < size; rr++) {
				if (!this.minesGame.grid[rr][c].revealed) { colCleared = false; break; }
			}
			if (colCleared && !this.minesGame.awardedCols.has(c)) {
				const award = bet * 0.08;
				this.updateBalance(award, 'Mines Column Cleared');
				this.minesGame.awardedCols.add(c);
				const status = document.getElementById('minesStatus');
				status.textContent = `Column ${c+1} cleared! You earned $${award.toFixed(2)}.`;

				// Temporary notification in minesResult
				const resultDiv = document.getElementById('minesResult');
				const note = document.createElement('div');
				note.className = 'mines-msg';
				note.textContent = `Column ${c+1} cleared: +$${award.toFixed(2)}`;
				resultDiv.appendChild(note);
				setTimeout(() => { if (note.parentElement) note.remove(); }, 4000);
			}

			if (this.minesGame.revealed >= this.minesGame.totalSafe) {
				this.endMinesGame(true);
				return;
			}
			// Continue playing
			document.getElementById('minesStatus').textContent = `Found ${this.minesGame.revealed} gems. ${this.minesGame.totalSafe - this.minesGame.revealed} safe squares left.`;
		}
	}

	endMinesGame(won) {
		if (!this.minesGame) return;
		this.minesGame.gameOver = true;
		const resultDiv = document.getElementById('minesResult');
		const gridDiv = document.getElementById('minesGrid');

		// Reveal all bombs
		for (let r = 0; r < this.minesGame.size; r++) {
			for (let c = 0; c < this.minesGame.size; c++) {
				const idx = r * this.minesGame.size + c;
				const cellEl = gridDiv.children[idx];
				const data = this.minesGame.grid[r][c];
				if (data.isBomb) {
					cellEl.textContent = '💣';
					cellEl.classList.add('bomb');
				}
			}
		}

		if (won) {
			// Pay out exactly 5x the bet (user requested 5×)
			const payout = this.minesGame.bet * 5;
			this.updateBalance(payout, 'Mines');
			resultDiv.innerHTML = `<div class="winning">🎉 You cleared the board! You win $${payout.toFixed(2)} (5x)! 🎉</div>`;
		} else {
			resultDiv.innerHTML = `<div class="losing">💥 Boom! You hit a bomb and lost your bet of $${this.minesGame.bet.toFixed(2)}.</div>`;
		}
	}

	// Poker (temporarily closed)
	loadPokerGame() {
		const gameContent = document.getElementById('gameContent');
		// Render a simple closed message instead of the full poker UI
		gameContent.innerHTML = `
			<div class="game-content">
				<div class="poker-closed" style="text-align:center;padding:2rem;">
					<h2 style="color:#f5f5dc;">Poker Temporarily Unavailable</h2>
					<p style="color:#bdc3c7;">Poker is closed for maintenance. Please try another game for now.</p>
					<div style="margin-top:1rem;"><button class="game-btn" id="pokerClosedBack">Back to Games</button></div>
				</div>
			</div>
		`;

		const backBtn = document.getElementById('pokerClosedBack');
		if (backBtn) backBtn.addEventListener('click', () => this.backToMenu());

		// No poker events wired while closed
		return;
	}

	// Server API helpers
	async getUserBalance(username) {
		try {
			const url = `/api/balance?username=${encodeURIComponent(username)}`;
			const res = await fetch(url, { method: 'GET' });
			if (!res.ok) return this.user.balance;
			const data = await res.json();
			return parseFloat(data.balance) || this.user.balance;
		} catch (err) {
			console.error('getUserBalance error', err);
			return this.user.balance;
		}
	}

	async updateUserBalance(username, amount) {
		try {
			const res = await fetch('/api/balance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, amount })
			});
			if (!res.ok) return this.user.balance;
			const data = await res.json();
			return parseFloat(data.balance) || this.user.balance;
		} catch ( err) {
			console.error('updateUserBalance error', err);
			return this.user.balance;
		}
	}

	// Sanitizes and validates numeric bet input values
	getSanitizedBet(inputElement) {
		if (!inputElement) return NaN;
		const raw = String(inputElement.value).trim();
		// Only allow digits and optional single decimal point
		if (!/^\d+(\.\d+)?$/.test(raw)) return NaN;
		const val = parseFloat(raw);
		if (!isFinite(val)) return NaN;
			   return val;
	}
	// Attach keydown filter to prevent entering minus, e, + characters
	attachNumericFilter(inputElement) {
		if (!inputElement) return;
		inputElement.addEventListener('keydown', (e) => {
			const blocked = ['e', 'E', '+', '-'];
			// Allow control keys
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (blocked.includes(e.key)) e.preventDefault();
		});
		// Optional: sanitize on paste
		inputElement.addEventListener('paste', (e) => {
			const text = (e.clipboardData || window.clipboardData).getData('text');
			if (!/^\d+(\.\d+)?$/.test(text.trim())) e.preventDefault();
		});
	}

	// Chat functions removed (chat system deleted)
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
	new CasinoGame();
});
