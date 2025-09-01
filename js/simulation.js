// 시뮬레이션 엔진 - EvoForge
class Simulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.environment = new Environment(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.canvas);
        this.tournament = new Tournament();
        this.evolutionTracker = new EvolutionTracker();
        
        // 시뮬레이션 상태
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 5; // 1-10 배속
        this.lastUpdateTime = 0;
        this.targetFPS = 60;
        this.actualFPS = 0;
        
        // AI 에이전트 설정
        this.agents = [
            AgentFactory.createExplorer("탐색형"),
            AgentFactory.createParasite("기생형"),
            AgentFactory.createAggressive("공격형")
        ];
        
        this.agents.forEach(agent => {
            this.tournament.addAgent(agent);
        });
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기화
        this.reset();
    }
    
    setupEventListeners() {
        // 마우스 이벤트 (항생제 투입)
        this.canvas.addEventListener('click', (event) => {
            if (this.isAntibioticMode) {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                this.environment.deployAntibiotic(x, y, 80, 3.0);
                this.isAntibioticMode = false;
                this.canvas.style.cursor = 'default';
            } else {
                // 엔티티 정보 표시
                this.showEntityInfo(event);
            }
        });
        
        // 마우스 호버 (엔티티 하이라이트)
        this.canvas.addEventListener('mousemove', (event) => {
            this.handleMouseHover(event);
        });
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastUpdateTime = performance.now();
            this.gameLoop();
        }
    }
    
    pause() {
        this.isPaused = !this.isPaused;
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
    }
    
    reset() {
        this.stop();
        this.environment.reset();
        this.evolutionTracker = new EvolutionTracker();
        
        // 에이전트 초기화
        this.agents.forEach(agent => {
            agent.controlledEntities = [];
            agent.score = 0;
            agent.performance = {
                totalOffspring: 0,
                totalSurvivalTime: 0,
                totalInfections: 0,
                averageFitness: 0
            };
        });
        
        // 초기 엔티티를 에이전트에게 할당
        this.assignInitialEntities();
    }
    
    assignInitialEntities() {
        const bacteria = this.environment.entities.filter(e => e.type === 'bacteria');
        const viruses = this.environment.entities.filter(e => e.type === 'virus');
        
        // 박테리아를 탐색형과 공격형 에이전트에게 할당
        bacteria.forEach((entity, index) => {
            const agentIndex = index % 2; // 탐색형(0)과 공격형(2) 번갈아가며
            const agent = this.agents[agentIndex === 0 ? 0 : 2];
            agent.assignEntity(entity);
        });
        
        // 바이러스를 기생형 에이전트에게 할당
        viruses.forEach(entity => {
            this.agents[1].assignEntity(entity); // 기생형 에이전트
        });
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        
        // FPS 계산
        this.actualFPS = 1000 / deltaTime;
        
        // 속도 조절
        const targetInterval = 1000 / (this.targetFPS * this.speed / 5);
        
        if (deltaTime >= targetInterval) {
            if (!this.isPaused) {
                this.update();
            }
            this.render();
            this.lastUpdateTime = currentTime;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 환경 업데이트
        this.environment.update();
        
        // AI 에이전트 업데이트
        this.agents.forEach(agent => {
            agent.update(this.environment);
        });
        
        // 진화 추적
        if (this.environment.tickCount % 50 === 0) {
            this.evolutionTracker.recordGeneration(this.environment.entities);
        }
        
        // 개체수 스냅샷
        this.environment.takePopulationSnapshot();
        
        // 새로운 엔티티를 에이전트에게 할당
        this.assignNewEntities();
        
        // 멸종 체크 및 재시작
        this.checkExtinction();
        
        // UI 업데이트
        this.updateUI();
    }
    
    assignNewEntities() {
        // 부모가 있는 새로운 엔티티는 부모와 같은 에이전트에게 할당
        this.environment.entities.forEach(entity => {
            if (!entity.aiAgent) {
                // 부모의 에이전트 찾기 (근처 엔티티 중에서)
                const nearbyEntities = this.environment.getEntitiesNear(entity.x, entity.y, 50);
                const parentEntity = nearbyEntities.find(e => 
                    e.aiAgent && 
                    e.type === entity.type && 
                    e.generationCount === entity.generationCount - 1
                );
                
                if (parentEntity) {
                    parentEntity.aiAgent.assignEntity(entity);
                } else {
                    // 기본 할당 로직
                    if (entity.type === 'bacteria') {
                        const agent = this.agents[Math.floor(Math.random() * 2) === 0 ? 0 : 2];
                        agent.assignEntity(entity);
                    } else {
                        this.agents[1].assignEntity(entity); // 기생형
                    }
                }
            }
        });
    }
    
    checkExtinction() {
        const stats = this.environment.getStatistics();
        
        // 전체 멸종 시 재시작
        if (stats.totalEntities < 5) {
            console.log("Population too low, repopulating...");
            this.environment.populateInitial(20, 5);
            this.assignInitialEntities();
        }
        
        // 특정 타입 멸종 시 재도입
        if (stats.bacteriaCount === 0) {
            console.log("Bacteria extinct, reintroducing...");
            for (let i = 0; i < 10; i++) {
                const bacteria = new Entity(
                    'bacteria',
                    Math.random() * this.environment.width,
                    Math.random() * this.environment.height
                );
                this.environment.addEntity(bacteria);
                this.agents[0].assignEntity(bacteria);
            }
        }
        
        if (stats.virusCount === 0) {
            console.log("Viruses extinct, reintroducing...");
            for (let i = 0; i < 5; i++) {
                const virus = new Entity(
                    'virus',
                    Math.random() * this.environment.width,
                    Math.random() * this.environment.height
                );
                virus.crystallized = true;
                this.environment.addEntity(virus);
                this.agents[1].assignEntity(virus);
            }
        }
    }
    
    render() {
        this.renderer.clear();
        
        // 환경 렌더링 (영양 맵)
        this.renderer.renderNutritionMap(this.environment.nutritionGrid, this.environment.gridSize);
        
        // 숙주 렌더링
        this.environment.hosts.forEach(host => {
            this.renderer.renderHost(host);
        });
        
        // 엔티티 렌더링
        this.environment.entities.forEach(entity => {
            this.renderer.renderEntity(entity);
        });
        
        // 항생제 효과 렌더링
        if (this.environment.antibioticLevel > 0) {
            this.renderer.renderAntibioticEffect(this.environment.antibioticLevel);
        }
        
        // UI 오버레이
        this.renderer.renderUI(this.environment.getStatistics(), this.actualFPS);
        
        // 에이전트 정보
        this.renderer.renderAgentInfo(this.agents);
        
        // 하이라이트된 엔티티
        if (this.highlightedEntity) {
            this.renderer.highlightEntity(this.highlightedEntity);
        }
    }
    
    updateUI() {
        const stats = this.environment.getStatistics();
        
        // 통계 업데이트
        document.getElementById('bacteria-count').textContent = stats.bacteriaCount;
        document.getElementById('virus-count').textContent = stats.virusCount;
        document.getElementById('host-count').textContent = stats.hostCount;
        document.getElementById('tick-count').textContent = stats.tickCount;
        
        // 에이전트 점수 업데이트
        document.getElementById('explorer-score').textContent = this.agents[0].score;
        document.getElementById('parasite-score').textContent = this.agents[1].score;
        document.getElementById('aggressive-score').textContent = this.agents[2].score;
        
        // 차트 업데이트
        this.updateEvolutionChart();
    }
    
    updateEvolutionChart() {
        const chartCanvas = document.getElementById('evolution-chart');
        const ctx = chartCanvas.getContext('2d');
        const history = this.environment.getPopulationHistory();
        
        if (history.length < 2) return;
        
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        
        const maxPop = Math.max(...history.map(h => h.bacteria + h.virus + h.host));
        const width = chartCanvas.width;
        const height = chartCanvas.height;
        
        // 박테리아 라인
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        history.forEach((point, index) => {
            const x = (index / (history.length - 1)) * width;
            const y = height - (point.bacteria / maxPop) * height;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 바이러스 라인
        ctx.strokeStyle = '#f44336';
        ctx.beginPath();
        history.forEach((point, index) => {
            const x = (index / (history.length - 1)) * width;
            const y = height - (point.virus / maxPop) * height;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 숙주 라인
        ctx.strokeStyle = '#2196F3';
        ctx.beginPath();
        history.forEach((point, index) => {
            const x = (index / (history.length - 1)) * width;
            const y = height - (point.host / maxPop) * height;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
    
    showEntityInfo(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 클릭 위치 근처의 엔티티 찾기
        const nearbyEntities = this.environment.getEntitiesNear(x, y, 20);
        const nearbyHosts = this.environment.getHostsNear(x, y, 20);
        
        const infoPanel = document.getElementById('entity-info');
        const detailsDiv = document.getElementById('entity-details');
        
        if (nearbyEntities.length > 0) {
            const entity = nearbyEntities[0];
            const entityInfo = entity.getDisplayInfo();
            const genomeInfo = entity.genome.getDisplayInfo();
            
            let html = '<h5>Entity Info</h5>';
            Object.entries(entityInfo).forEach(([key, value]) => {
                html += `<div><strong>${key}:</strong> ${value}</div>`;
            });
            
            html += '<h5>Genome</h5>';
            Object.entries(genomeInfo).forEach(([key, value]) => {
                html += `<div><strong>${key}:</strong> ${value}</div>`;
            });
            
            if (entity.aiAgent) {
                html += `<h5>AI Agent</h5>`;
                html += `<div><strong>Agent:</strong> ${entity.aiAgent.name}</div>`;
                html += `<div><strong>Score:</strong> ${entity.aiAgent.score}</div>`;
            }
            
            detailsDiv.innerHTML = html;
            infoPanel.classList.remove('hidden');
        } else if (nearbyHosts.length > 0) {
            const host = nearbyHosts[0];
            
            let html = '<h5>Host Info</h5>';
            html += `<div><strong>ID:</strong> ${host.id.substr(-6)}</div>`;
            html += `<div><strong>Energy:</strong> ${host.energy.toFixed(1)}</div>`;
            html += `<div><strong>Age:</strong> ${host.age}</div>`;
            html += `<div><strong>Infected:</strong> ${host.infected ? 'Yes' : 'No'}</div>`;
            
            detailsDiv.innerHTML = html;
            infoPanel.classList.remove('hidden');
        } else {
            infoPanel.classList.add('hidden');
        }
    }
    
    handleMouseHover(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 마우스 근처의 엔티티 하이라이트
        const nearbyEntities = this.environment.getEntitiesNear(x, y, 15);
        this.highlightedEntity = nearbyEntities.length > 0 ? nearbyEntities[0] : null;
    }
    
    setSpeed(speed) {
        this.speed = Math.max(1, Math.min(10, speed));
    }
    
    setMutationRate(rate) {
        // 전역 돌연변이율 설정 (실제로는 각 엔티티의 mutate 함수에서 사용)
        this.mutationRate = rate;
    }
    
    setNutritionLevel(level) {
        this.environment.nutritionLevel = level;
    }
    
    enableAntibioticMode() {
        this.isAntibioticMode = true;
        this.canvas.style.cursor = 'crosshair';
    }
    
    startTournament() {
        this.tournament.startTournament(this.environment, 2000);
    }
    
    exportData() {
        return {
            statistics: this.environment.getStatistics(),
            populationHistory: this.environment.getPopulationHistory(),
            evolutionData: this.evolutionTracker.history,
            agentPerformance: this.agents.map(agent => ({
                name: agent.name,
                performance: agent.performance,
                score: agent.score
            })),
            tournamentResults: this.tournament.rounds
        };
    }
    
    importData(data) {
        // 데이터 복원 기능 (향후 구현)
        console.log("Import data:", data);
    }
}