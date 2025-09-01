// AI 에이전트 시스템 - EvoForge
class AIAgent {
    constructor(name, strategy, color) {
        this.name = name;
        this.strategy = strategy;
        this.color = color;
        this.score = 0;
        this.controlledEntities = [];
        this.actionHistory = [];
        this.performance = {
            totalOffspring: 0,
            totalSurvivalTime: 0,
            totalInfections: 0,
            averageFitness: 0
        };
    }
    
    assignEntity(entity) {
        entity.aiAgent = this;
        this.controlledEntities.push(entity);
    }
    
    removeEntity(entity) {
        this.controlledEntities = this.controlledEntities.filter(e => e.id !== entity.id);
    }
    
    update(environment) {
        // 죽은 엔티티 정리
        this.controlledEntities = this.controlledEntities.filter(entity => !entity.dead);
        
        // 각 엔티티에 대해 행동 결정
        this.controlledEntities.forEach(entity => {
            const action = this.decideAction(entity, environment);
            this.executeAction(entity, action, environment);
        });
        
        // 성능 업데이트
        this.updatePerformance();
    }
    
    decideAction(entity, environment) {
        const observation = entity.getObservation(environment);
        return this.strategy(entity, observation, environment);
    }
    
    executeAction(entity, action, environment) {
        if (!action || entity.actionCooldown > 0) return;
        
        switch (action.type) {
            case 'move':
                this.executeMove(entity, action);
                break;
            case 'divide':
                this.executeDivide(entity, environment);
                break;
            case 'infect':
                this.executeInfect(entity, action, environment);
                break;
            case 'crystallize':
                this.executeCrystallize(entity);
                break;
            case 'express_gene':
                this.executeGeneExpression(entity, action);
                break;
        }
        
        this.actionHistory.push({
            entityId: entity.id,
            action: action,
            tick: environment.tickCount
        });
    }
    
    executeMove(entity, action) {
        const moveDistance = entity.genome.genes.mobility * 15;
        entity.x += action.dx * moveDistance;
        entity.y += action.dy * moveDistance;
        
        // 경계 체크
        entity.x = Math.max(0, Math.min(800, entity.x));
        entity.y = Math.max(0, Math.min(600, entity.y));
        
        entity.actionCooldown = Math.floor(5 / entity.genome.genes.mobility);
    }
    
    executeDivide(entity, environment) {
        if (entity.canDivide()) {
            const offspring = entity.divide();
            if (offspring) {
                this.assignEntity(offspring);
                environment.addEntity(offspring);
                this.performance.totalOffspring++;
            }
        }
    }
    
    executeInfect(entity, action, environment) {
        if (entity.type === 'virus' && !entity.infected_host_id) {
            const target = environment.getEntityById(action.targetId);
            if (target) {
                entity.attemptInfection(target, environment);
            }
        }
    }
    
    executeCrystallize(entity) {
        if (entity.type === 'virus') {
            entity.crystallized = true;
        }
    }
    
    executeGeneExpression(entity, action) {
        // 일시적 유전자 발현 강화 (에너지 소모)
        if (entity.energy > 5) {
            const geneName = action.gene;
            const level = action.level;
            
            // 임시 효과 적용 (다음 몇 틱 동안)
            entity.tempGeneBoost = entity.tempGeneBoost || {};
            entity.tempGeneBoost[geneName] = {
                level: level,
                duration: 10
            };
            
            entity.energy -= 2;
        }
    }
    
    updatePerformance() {
        this.score = this.controlledEntities.length;
        
        // 평균 적합도 계산
        if (this.controlledEntities.length > 0) {
            const totalFitness = this.controlledEntities.reduce((sum, entity) => {
                return sum + entity.genome.getFitnessScore();
            }, 0);
            this.performance.averageFitness = totalFitness / this.controlledEntities.length;
        }
        
        // 총 생존 시간 계산
        this.performance.totalSurvivalTime = this.controlledEntities.reduce((sum, entity) => {
            return sum + entity.age;
        }, 0);
        
        // 총 감염 수 계산
        this.performance.totalInfections = this.controlledEntities.reduce((sum, entity) => {
            return sum + (entity.infectionCount || 0);
        }, 0);
    }
}

// 탐색형 에이전트 전략
function explorerStrategy(entity, observation, environment) {
    const { self, environment: envGrid, genes } = observation;
    
    // 에너지가 부족하면 영양 찾기
    if (self.energy < 0.6) {
        return findNutritionAction(envGrid);
    }
    
    // 분열 가능하면 분열
    if (self.canDivide && self.energy > 0.8) {
        return { type: 'divide' };
    }
    
    // 위험 회피 (항생제나 경쟁자 많은 곳)
    const dangerousArea = findDangerousArea(envGrid);
    if (dangerousArea) {
        return avoidDangerAction(dangerousArea);
    }
    
    // 기본 탐색 행동
    return exploreAction(envGrid, genes);
}

// 기생형 에이전트 전략 (바이러스용)
function parasiteStrategy(entity, observation, environment) {
    const { self, environment: envGrid } = observation;
    
    // 숙주 내부에 있으면 증식에 집중
    if (entity.infected_host_id) {
        return { type: 'replicate' };
    }
    
    // 결정화 상태가 아니고 숙주가 근처에 있으면 감염 시도
    if (!entity.crystallized) {
        const nearbyHosts = findNearbyHosts(envGrid);
        if (nearbyHosts.length > 0) {
            return { 
                type: 'infect', 
                targetId: nearbyHosts[0].id 
            };
        }
    }
    
    // 숙주를 찾아 이동
    const hostDirection = findHostDirection(envGrid);
    if (hostDirection) {
        return {
            type: 'move',
            dx: hostDirection.x,
            dy: hostDirection.y
        };
    }
    
    // 숙주가 없으면 결정화
    return { type: 'crystallize' };
}

// 공격형 에이전트 전략
function aggressiveStrategy(entity, observation, environment) {
    const { self, environment: envGrid, genes } = observation;
    
    // 높은 에너지 상태에서 빠른 분열
    if (self.canDivide && self.energy > 0.7) {
        return { type: 'divide' };
    }
    
    // 경쟁자가 많은 곳으로 이동하여 자원 경쟁
    const competitorDirection = findCompetitorDirection(envGrid);
    if (competitorDirection) {
        return {
            type: 'move',
            dx: competitorDirection.x,
            dy: competitorDirection.y
        };
    }
    
    // 대사율 강화로 빠른 성장
    if (self.energy > 0.5) {
        return {
            type: 'express_gene',
            gene: 'metabolism',
            level: 1.5
        };
    }
    
    return findNutritionAction(envGrid);
}

// 보조 함수들
function findNutritionAction(envGrid) {
    let bestDirection = { x: 0, y: 0 };
    let maxNutrition = 0;
    
    for (let i = 0; i < envGrid.length; i++) {
        for (let j = 0; j < envGrid[i].length; j++) {
            if (envGrid[i][j].nutrition > maxNutrition) {
                maxNutrition = envGrid[i][j].nutrition;
                bestDirection = {
                    x: (j - 2) / 2, // 중앙(2,2)을 기준으로 정규화
                    y: (i - 2) / 2
                };
            }
        }
    }
    
    if (maxNutrition > 0) {
        return {
            type: 'move',
            dx: bestDirection.x,
            dy: bestDirection.y
        };
    }
    
    return null;
}

function findDangerousArea(envGrid) {
    const centerCell = envGrid[2][2]; // 중앙 셀
    
    // 경쟁자가 너무 많으면 위험
    if (centerCell.entities > 5) {
        return { type: 'overcrowding', level: centerCell.entities };
    }
    
    return null;
}

function avoidDangerAction(danger) {
    // 위험에서 벗어나는 랜덤 방향
    const angle = Math.random() * 2 * Math.PI;
    return {
        type: 'move',
        dx: Math.cos(angle),
        dy: Math.sin(angle)
    };
}

function exploreAction(envGrid, genes) {
    // 센서 범위에 따른 탐색 전략
    const sensorRange = genes.sensor_range;
    
    if (sensorRange > 3) {
        // 넓은 센서 범위: 체계적 탐색
        return systematicExploreAction();
    } else {
        // 좁은 센서 범위: 랜덤 탐색
        return randomExploreAction();
    }
}

function systematicExploreAction() {
    // 격자 패턴으로 탐색
    const directions = [
        { x: 1, y: 0 }, { x: 0, y: 1 }, 
        { x: -1, y: 0 }, { x: 0, y: -1 }
    ];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    return {
        type: 'move',
        dx: direction.x,
        dy: direction.y
    };
}

function randomExploreAction() {
    const angle = Math.random() * 2 * Math.PI;
    return {
        type: 'move',
        dx: Math.cos(angle),
        dy: Math.sin(angle)
    };
}

function findNearbyHosts(envGrid) {
    const hosts = [];
    
    for (let i = 0; i < envGrid.length; i++) {
        for (let j = 0; j < envGrid[i].length; j++) {
            if (envGrid[i][j].hosts > 0) {
                hosts.push({
                    x: j - 2,
                    y: i - 2,
                    count: envGrid[i][j].hosts
                });
            }
        }
    }
    
    return hosts;
}

function findHostDirection(envGrid) {
    const hosts = findNearbyHosts(envGrid);
    
    if (hosts.length === 0) return null;
    
    // 가장 가까운 숙주 방향
    let nearestHost = hosts[0];
    let minDistance = Math.sqrt(nearestHost.x * nearestHost.x + nearestHost.y * nearestHost.y);
    
    hosts.forEach(host => {
        const distance = Math.sqrt(host.x * host.x + host.y * host.y);
        if (distance < minDistance) {
            nearestHost = host;
            minDistance = distance;
        }
    });
    
    const distance = Math.sqrt(nearestHost.x * nearestHost.x + nearestHost.y * nearestHost.y);
    
    return {
        x: nearestHost.x / distance,
        y: nearestHost.y / distance
    };
}

function findCompetitorDirection(envGrid) {
    let maxCompetitors = 0;
    let bestDirection = null;
    
    for (let i = 0; i < envGrid.length; i++) {
        for (let j = 0; j < envGrid[i].length; j++) {
            if (envGrid[i][j].entities > maxCompetitors) {
                maxCompetitors = envGrid[i][j].entities;
                bestDirection = {
                    x: (j - 2) / 2,
                    y: (i - 2) / 2
                };
            }
        }
    }
    
    return bestDirection;
}

// 토너먼트 시스템
class Tournament {
    constructor() {
        this.rounds = [];
        this.currentRound = 0;
        this.agents = [];
    }
    
    addAgent(agent) {
        this.agents.push(agent);
    }
    
    startTournament(environment, roundDuration = 1000) {
        this.currentRound = 0;
        this.rounds = [];
        
        // 각 에이전트에게 초기 엔티티 할당
        this.agents.forEach((agent, index) => {
            agent.controlledEntities = [];
            agent.score = 0;
            
            // 각 에이전트에게 동일한 수의 초기 엔티티 할당
            const entitiesPerAgent = Math.floor(environment.entities.length / this.agents.length);
            const startIndex = index * entitiesPerAgent;
            const endIndex = startIndex + entitiesPerAgent;
            
            for (let i = startIndex; i < endIndex && i < environment.entities.length; i++) {
                agent.assignEntity(environment.entities[i]);
            }
        });
        
        // 라운드 시작
        this.runRound(environment, roundDuration);
    }
    
    runRound(environment, duration) {
        const startTick = environment.tickCount;
        const endTick = startTick + duration;
        
        const roundInterval = setInterval(() => {
            // 에이전트 업데이트
            this.agents.forEach(agent => {
                agent.update(environment);
            });
            
            // 라운드 종료 체크
            if (environment.tickCount >= endTick) {
                clearInterval(roundInterval);
                this.finishRound(environment);
            }
        }, 50); // 20 FPS
    }
    
    finishRound(environment) {
        const roundResult = {
            round: this.currentRound + 1,
            results: this.agents.map(agent => ({
                name: agent.name,
                score: agent.score,
                performance: { ...agent.performance },
                entities: agent.controlledEntities.length
            }))
        };
        
        // 결과 정렬 (점수 기준)
        roundResult.results.sort((a, b) => b.score - a.score);
        
        this.rounds.push(roundResult);
        this.currentRound++;
        
        // 결과 출력
        console.log(`Round ${roundResult.round} Results:`);
        roundResult.results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}: ${result.score} points`);
        });
    }
    
    getLeaderboard() {
        if (this.rounds.length === 0) return [];
        
        const totalScores = {};
        
        this.agents.forEach(agent => {
            totalScores[agent.name] = 0;
        });
        
        this.rounds.forEach(round => {
            round.results.forEach(result => {
                totalScores[result.name] += result.score;
            });
        });
        
        return Object.entries(totalScores)
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score);
    }
}

// 에이전트 팩토리
class AgentFactory {
    static createExplorer(name = "Explorer") {
        return new AIAgent(name, explorerStrategy, '#4CAF50');
    }
    
    static createParasite(name = "Parasite") {
        return new AIAgent(name, parasiteStrategy, '#f44336');
    }
    
    static createAggressive(name = "Aggressive") {
        return new AIAgent(name, aggressiveStrategy, '#FF9800');
    }
    
    static createCustomAgent(name, strategyFunction, color) {
        return new AIAgent(name, strategyFunction, color);
    }
}