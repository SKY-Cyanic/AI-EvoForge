// UI 컨트롤러 - EvoForge
class UIController {
    constructor(simulation) {
        this.simulation = simulation;
        this.setupEventListeners();
        this.updateInterval = null;
    }
    
    setupEventListeners() {
        // 시뮬레이션 제어 버튼들
        document.getElementById('start-btn').addEventListener('click', () => {
            this.simulation.start();
            this.updateButtonStates();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.simulation.pause();
            this.updateButtonStates();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('시뮬레이션을 리셋하시겠습니까?')) {
                this.simulation.reset();
                this.updateButtonStates();
            }
        });
        
        document.getElementById('antibiotic-btn').addEventListener('click', () => {
            this.simulation.enableAntibioticMode();
            this.showNotification('클릭하여 항생제를 투입하세요', 'info');
        });
        
        // 속도 조절 슬라이더
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplay = document.getElementById('speed-display');
        
        speedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.simulation.setSpeed(speed);
            speedDisplay.textContent = speed + 'x';
        });
        
        // 환경 설정 슬라이더들
        const mutationSlider = document.getElementById('mutation-rate');
        const mutationDisplay = document.getElementById('mutation-display');
        
        mutationSlider.addEventListener('input', (e) => {
            const rate = parseFloat(e.target.value);
            this.simulation.setMutationRate(rate);
            mutationDisplay.textContent = (rate * 100).toFixed(1) + '%';
        });
        
        const nutritionSlider = document.getElementById('nutrition-level');
        const nutritionDisplay = document.getElementById('nutrition-display');
        
        nutritionSlider.addEventListener('input', (e) => {
            const level = parseFloat(e.target.value);
            this.simulation.setNutritionLevel(level);
            nutritionDisplay.textContent = level.toFixed(1) + 'x';
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // 엔티티 정보 패널 닫기
        document.addEventListener('click', (e) => {
            const infoPanel = document.getElementById('entity-info');
            if (!infoPanel.contains(e.target) && !this.simulation.canvas.contains(e.target)) {
                infoPanel.classList.add('hidden');
            }
        });
        
        // 토너먼트 관련 버튼들 (동적 생성)
        this.createTournamentControls();
        
        // 데이터 내보내기/가져오기 버튼들
        this.createDataControls();
        
        // 설정 패널 토글
        this.createSettingsPanel();
    }
    
    handleKeyPress(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.simulation.pause();
                this.updateButtonStates();
                break;
            case 'KeyR':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.simulation.reset();
                    this.updateButtonStates();
                }
                break;
            case 'KeyA':
                this.simulation.enableAntibioticMode();
                break;
            case 'KeyT':
                this.startTournament();
                break;
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
                const speed = parseInt(event.code.slice(-1));
                this.simulation.setSpeed(speed);
                document.getElementById('speed-slider').value = speed;
                document.getElementById('speed-display').textContent = speed + 'x';
                break;
        }
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.simulation.isRunning) {
            startBtn.textContent = '실행 중';
            startBtn.disabled = true;
            pauseBtn.textContent = this.simulation.isPaused ? '재개' : '일시정지';
            pauseBtn.disabled = false;
        } else {
            startBtn.textContent = '시뮬레이션 시작';
            startBtn.disabled = false;
            pauseBtn.textContent = '일시정지';
            pauseBtn.disabled = true;
        }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 스타일 적용
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // 타입별 색상
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                break;
            case 'warning':
                notification.style.backgroundColor = '#FF9800';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            default:
                notification.style.backgroundColor = '#2196F3';
        }
        
        document.body.appendChild(notification);
        
        // 애니메이션 시작
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 자동 제거
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    createTournamentControls() {
        const tournamentPanel = document.querySelector('.tournament-panel');
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'tournament-controls';
        controlsDiv.style.marginBottom = '1rem';
        
        const startTournamentBtn = document.createElement('button');
        startTournamentBtn.textContent = '🏆 토너먼트 시작';
        startTournamentBtn.className = 'btn primary';
        startTournamentBtn.style.width = '48%';
        startTournamentBtn.style.marginRight = '4%';
        
        const viewResultsBtn = document.createElement('button');
        viewResultsBtn.textContent = '📊 결과 보기';
        viewResultsBtn.className = 'btn secondary';
        viewResultsBtn.style.width = '48%';
        
        startTournamentBtn.addEventListener('click', () => {
            this.startTournament();
        });
        
        viewResultsBtn.addEventListener('click', () => {
            this.showTournamentResults();
        });
        
        controlsDiv.appendChild(startTournamentBtn);
        controlsDiv.appendChild(viewResultsBtn);
        
        tournamentPanel.insertBefore(controlsDiv, tournamentPanel.firstChild.nextSibling);
    }
    
    createDataControls() {
        const controlPanel = document.querySelector('.controls');
        
        const dataControlsDiv = document.createElement('div');
        dataControlsDiv.innerHTML = `
            <h4 style="margin: 1rem 0 0.5rem 0; color: #ffd700;">📁 데이터</h4>
            <button id="export-btn" class="btn secondary" style="margin-bottom: 0.5rem;">데이터 내보내기</button>
            <button id="screenshot-btn" class="btn secondary">스크린샷</button>
        `;
        
        controlPanel.appendChild(dataControlsDiv);
        
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('screenshot-btn').addEventListener('click', () => {
            this.takeScreenshot();
        });
    }
    
    createSettingsPanel() {
        const controlPanel = document.querySelector('.controls');
        
        const settingsDiv = document.createElement('div');
        settingsDiv.innerHTML = `
            <h4 style="margin: 1rem 0 0.5rem 0; color: #ffd700;">⚙️ 시각화 옵션</h4>
            <label style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <input type="checkbox" id="show-nutrition" checked style="margin-right: 0.5rem;">
                영양 맵 표시
            </label>
            <label style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <input type="checkbox" id="show-sensors" style="margin-right: 0.5rem;">
                센서 범위 표시
            </label>
            <label style="display: flex; align-items: center;">
                <input type="checkbox" id="show-trails" style="margin-right: 0.5rem;">
                이동 궤적 표시
            </label>
        `;
        
        controlPanel.appendChild(settingsDiv);
        
        document.getElementById('show-nutrition').addEventListener('change', (e) => {
            this.simulation.renderer.toggleNutritionMap();
        });
        
        document.getElementById('show-sensors').addEventListener('change', (e) => {
            this.simulation.renderer.toggleSensorRange();
        });
        
        document.getElementById('show-trails').addEventListener('change', (e) => {
            this.simulation.renderer.toggleTrails();
        });
    }
    
    startTournament() {
        if (this.simulation.isRunning) {
            this.showNotification('시뮬레이션을 일시정지한 후 토너먼트를 시작하세요', 'warning');
            return;
        }
        
        this.showNotification('토너먼트 시작!', 'success');
        this.simulation.startTournament();
        
        // 토너먼트 진행 상황 업데이트
        this.updateTournamentProgress();
    }
    
    updateTournamentProgress() {
        const resultsDiv = document.getElementById('tournament-results');
        const tournament = this.simulation.tournament;
        
        if (tournament.rounds.length === 0) {
            resultsDiv.innerHTML = '<div class="tournament-item"><span>토너먼트 준비 중...</span></div>';
            return;
        }
        
        let html = '';
        tournament.rounds.forEach((round, index) => {
            html += `<div class="tournament-item">`;
            html += `<span>라운드 ${round.round}:</span>`;
            html += `<span>${round.results[0].name} (${round.results[0].score}점)</span>`;
            html += `</div>`;
        });
        
        // 현재 리더보드
        const leaderboard = tournament.getLeaderboard();
        if (leaderboard.length > 0) {
            html += '<div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 1rem;">';
            html += '<h4 style="color: #ffd700; margin-bottom: 0.5rem;">🏆 총 순위</h4>';
            leaderboard.forEach((entry, index) => {
                html += `<div class="tournament-item">`;
                html += `<span>${index + 1}. ${entry.name}</span>`;
                html += `<span>${entry.score}점</span>`;
                html += `</div>`;
            });
            html += '</div>';
        }
        
        resultsDiv.innerHTML = html;
    }
    
    showTournamentResults() {
        const tournament = this.simulation.tournament;
        const results = tournament.rounds;
        
        if (results.length === 0) {
            this.showNotification('아직 토너먼트 결과가 없습니다', 'info');
            return;
        }
        
        // 모달 창으로 상세 결과 표시
        this.showModal('토너먼트 결과', this.generateTournamentResultsHTML(results));
    }
    
    generateTournamentResultsHTML(results) {
        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        
        results.forEach(round => {
            html += `<div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 6px;">`;
            html += `<h4 style="color: #ffd700; margin-bottom: 1rem;">라운드 ${round.round}</h4>`;
            
            round.results.forEach((result, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                html += `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">`;
                html += `<span>${medal} ${result.name}</span>`;
                html += `<span>${result.score}점 (${result.entities}개체)</span>`;
                html += `</div>`;
            });
            
            html += `</div>`;
        });
        
        html += '</div>';
        return html;
    }
    
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            padding: 2rem;
            border-radius: 10px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #ffd700;">${title}</h2>
                <button id="modal-close" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">✕</button>
            </div>
            ${content}
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 닫기 이벤트
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        document.getElementById('modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // ESC 키로 닫기
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
    
    exportData() {
        const data = this.simulation.exportData();
        const jsonString = JSON.stringify(data, null, 2);
        
        // 파일 다운로드
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `evoforge-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.showNotification('데이터가 다운로드되었습니다', 'success');
    }
    
    takeScreenshot() {
        const canvas = this.simulation.canvas;
        const link = document.createElement('a');
        
        link.download = `evoforge-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        this.showNotification('스크린샷이 저장되었습니다', 'success');
    }
    
    // 실시간 통계 업데이트
    startStatsUpdater() {
        this.updateInterval = setInterval(() => {
            if (this.simulation.isRunning && !this.simulation.isPaused) {
                this.updateTournamentProgress();
                this.updateAdvancedStats();
            }
        }, 1000);
    }
    
    stopStatsUpdater() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    updateAdvancedStats() {
        // 고급 통계 정보 업데이트
        const stats = this.simulation.environment.getStatistics();
        const evolutionTrends = this.simulation.evolutionTracker.getEvolutionTrends();
        
        // 추가 통계 정보가 필요한 경우 여기에 구현
        if (evolutionTrends) {
            console.log('Evolution trends:', evolutionTrends);
        }
    }
    
    // 키보드 단축키 도움말
    showHelp() {
        const helpContent = `
            <div style="line-height: 1.6;">
                <h3 style="color: #ffd700; margin-bottom: 1rem;">⌨️ 키보드 단축키</h3>
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <strong>스페이스바</strong><span>일시정지/재개</span>
                    <strong>Ctrl + R</strong><span>시뮬레이션 리셋</span>
                    <strong>A</strong><span>항생제 투입 모드</span>
                    <strong>T</strong><span>토너먼트 시작</span>
                    <strong>1-5</strong><span>시뮬레이션 속도 조절</span>
                </div>
                
                <h3 style="color: #ffd700; margin-bottom: 1rem;">🖱️ 마우스 조작</h3>
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <strong>클릭</strong><span>엔티티 정보 보기</span>
                    <strong>항생제 모드 + 클릭</strong><span>항생제 투입</span>
                    <strong>마우스 호버</strong><span>엔티티 하이라이트</span>
                </div>
                
                <h3 style="color: #ffd700; margin-bottom: 1rem;">🧬 게임 정보</h3>
                <div style="line-height: 1.8;">
                    <p><strong>박테리아:</strong> 자율적으로 성장하고 분열하며 영양을 섭취합니다.</p>
                    <p><strong>바이러스:</strong> 숙주에 감염되어 증식하고, 외부에서는 결정화됩니다.</p>
                    <p><strong>AI 에이전트:</strong> 다양한 전략으로 개체들을 제어합니다.</p>
                    <p><strong>진화:</strong> 돌연변이와 선택압을 통해 유전자가 변화합니다.</p>
                </div>
            </div>
        `;
        
        this.showModal('도움말', helpContent);
    }
    
    // 초기화
    initialize() {
        this.updateButtonStates();
        this.startStatsUpdater();
        
        // 도움말 버튼 추가
        const helpBtn = document.createElement('button');
        helpBtn.textContent = '❓ 도움말';
        helpBtn.className = 'btn secondary';
        helpBtn.style.marginTop = '1rem';
        helpBtn.addEventListener('click', () => this.showHelp());
        
        document.querySelector('.controls').appendChild(helpBtn);
        
        // 환영 메시지
        setTimeout(() => {
            this.showNotification('EvoForge에 오신 것을 환영합니다! 시뮬레이션을 시작해보세요.', 'success', 5000);
        }, 1000);
    }
}