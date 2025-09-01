// 엔티티 시스템 - EvoForge
class Entity {
    constructor(type, x, y, genome = null) {
        this.id = this.generateId();
        this.type = type; // 'bacteria' or 'virus'
        this.genome = genome || new Genome();
        
        // 위치
        this.x = x;
        this.y = y;
        
        // 상태
        this.age = 0;
        this.energy = type === 'bacteria' ? 20 : 5;
        this.maxEnergy = type === 'bacteria' ? 100 : 20;
        this.infected_host_id = null;
        this.crystallized = false;
        this.dead = false;
        
        // 시각적 속성
        this.visual = {
            sprite: this.getDefaultSprite(),
            scale: 1.0,
            color_shift: [Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2],
            rotation: 0
        };
        
        // 행동 관련
        this.lastAction = null;
        this.actionCooldown = 0;
        this.reproductionCooldown = 0;
        
        // 통계
        this.generationCount = 0;
        this.offspringCount = 0;
        this.infectionCount = 0;
    }
    
    generateId() {
        return 'entity_' + Math.random().toString(36).substr(2, 9);
    }
    
    getDefaultSprite() {
        if (this.type === 'bacteria') {
            const sprites = ['bact_blue_01', 'bact_green_01', 'bact_yellow_01'];
            return sprites[Math.floor(Math.random() * sprites.length)];
        } else {
            const sprites = ['virus_red_01', 'virus_purple_01', 'virus_orange_01'];
            return sprites[Math.floor(Math.random() * sprites.length)];
        }
    }
    
    update(environment) {
        this.age++;
        this.actionCooldown = Math.max(0, this.actionCooldown - 1);
        this.reproductionCooldown = Math.max(0, this.reproductionCooldown - 1);
        
        // 에너지 소모 (기본 대사)
        const metabolicCost = 0.1 * (1 - this.genome.genes.metabolism);
        this.energy = Math.max(0, this.energy - metabolicCost);
        
        // 나이에 따른 사망 확률
        if (this.age > 1000 && Math.random() < 0.001 * (this.age - 1000)) {
            this.dead = true;
        }
        
        // 에너지 부족으로 인한 사망
        if (this.energy <= 0) {
            this.dead = true;
        }
        
        // 타입별 업데이트
        if (this.type === 'bacteria') {
            this.updateBacteria(environment);
        } else {
            this.updateVirus(environment);
        }
    }
    
    updateBacteria(environment) {
        // 영양 흡수
        const localNutrition = environment.getNutritionAt(this.x, this.y);
        if (localNutrition > 0) {
            const absorbed = Math.min(localNutrition, 2 * this.genome.genes.metabolism);
            this.energy = Math.min(this.maxEnergy, this.energy + absorbed);
            environment.consumeNutrition(this.x, this.y, absorbed);
        }
        
        // 자동 이동 (영양 찾기)
        if (this.actionCooldown === 0) {
            this.autoMove(environment);
        }
        
        // 분열 가능성 체크
        if (this.canDivide()) {
            const offspring = this.divide();
            if (offspring) {
                environment.addEntity(offspring);
            }
        }
    }
    
    updateVirus(environment) {
        if (this.infected_host_id) {
            // 숙주 내부에서 증식
            const host = environment.getEntityById(this.infected_host_id);
            if (host && !host.dead) {
                this.replicateInHost(host, environment);
            } else {
                // 숙주가 죽었으면 외부로 방출
                this.infected_host_id = null;
                this.crystallized = true;
            }
        } else {
            // 외부 환경에서 결정화
            if (!this.crystallized) {
                this.crystallized = true;
            }
            
            // 결정화 상태에서는 천천히 분해
            if (Math.random() < 0.0001) {
                this.energy -= 0.1;
            }
            
            // 숙주 탐지 및 감염 시도
            this.seekAndInfectHost(environment);
        }
    }
    
    autoMove(environment) {
        const sensorRange = this.genome.genes.sensor_range * 20;
        const mobility = this.genome.genes.mobility;
        
        // 주변 환경 스캔
        let bestDirection = { x: 0, y: 0, score: -1 };
        
        for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
            const dx = Math.cos(angle) * sensorRange;
            const dy = Math.sin(angle) * sensorRange;
            const targetX = this.x + dx;
            const targetY = this.y + dy;
            
            let score = 0;
            
            if (this.type === 'bacteria') {
                // 박테리아는 영양을 찾음
                score = environment.getNutritionAt(targetX, targetY);
            } else {
                // 바이러스는 숙주를 찾음
                const hosts = environment.getHostsNear(targetX, targetY, sensorRange);
                score = hosts.length;
            }
            
            if (score > bestDirection.score) {
                bestDirection = { x: dx, y: dy, score };
            }
        }
        
        // 이동 실행
        if (bestDirection.score > 0) {
            const moveDistance = mobility * 10;
            const normalizedX = bestDirection.x / sensorRange;
            const normalizedY = bestDirection.y / sensorRange;
            
            this.x += normalizedX * moveDistance;
            this.y += normalizedY * moveDistance;
            
            // 경계 체크
            this.x = Math.max(0, Math.min(800, this.x));
            this.y = Math.max(0, Math.min(600, this.y));
            
            this.actionCooldown = Math.floor(10 / mobility);
        }
    }
    
    canDivide() {
        const energyThreshold = 40;
        return this.type === 'bacteria' && 
               this.energy >= energyThreshold && 
               this.reproductionCooldown === 0;
    }
    
    divide() {
        if (!this.canDivide()) return null;
        
        // 에너지 분할
        this.energy /= 2;
        
        // 자식 생성 (돌연변이 포함)
        const mutatedGenome = this.genome.mutate(0.005);
        const offspring = new Entity(
            this.type,
            this.x + (Math.random() - 0.5) * 20, // 약간의 위치 변화
            this.y + (Math.random() - 0.5) * 20,
            mutatedGenome
        );
        
        offspring.generationCount = this.generationCount + 1;
        
        // 통계 업데이트
        this.offspringCount++;
        
        // 재생산 쿨다운
        this.reproductionCooldown = Math.floor(50 / this.genome.genes.replication_rate);
        
        return offspring;
    }
    
    seekAndInfectHost(environment) {
        const hosts = environment.getHostsNear(this.x, this.y, this.genome.genes.sensor_range * 30);
        
        if (hosts.length === 0) return;
        
        // 가장 가까운 숙주 선택
        let nearestHost = hosts[0];
        let minDistance = this.getDistance(nearestHost);
        
        hosts.forEach(host => {
            const distance = this.getDistance(host);
            if (distance < minDistance) {
                nearestHost = host;
                minDistance = distance;
            }
        });
        
        // 감염 시도
        if (minDistance < 30) {
            this.attemptInfection(nearestHost, environment);
        } else {
            // 숙주 쪽으로 이동
            const dx = nearestHost.x - this.x;
            const dy = nearestHost.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const moveSpeed = this.genome.genes.mobility * 5;
                this.x += (dx / distance) * moveSpeed;
                this.y += (dy / distance) * moveSpeed;
            }
        }
    }
    
    attemptInfection(host, environment) {
        const infectionProb = this.genome.genes.capsid_strength * 
                             this.genome.genes.host_specificity * 
                             (1 - host.genome.genes.resistance);
        
        if (Math.random() < infectionProb) {
            this.infected_host_id = host.id;
            this.crystallized = false;
            this.infectionCount++;
            
            // 숙주 내부로 이동
            this.x = host.x;
            this.y = host.y;
        }
    }
    
    replicateInHost(host, environment) {
        // 숙주 에너지 흡수
        const energyDrain = this.genome.genes.replication_rate * 2;
        host.energy = Math.max(0, host.energy - energyDrain);
        this.energy += energyDrain * 0.5;
        
        // 복제 시도
        if (this.energy > 10 && Math.random() < this.genome.genes.replication_rate) {
            const replicationCount = Math.floor(1 + this.genome.genes.replication_rate * 5);
            
            for (let i = 0; i < replicationCount; i++) {
                const mutatedGenome = this.genome.mutate(0.01); // 바이러스는 돌연변이율이 높음
                const virion = new Entity('virus', this.x, this.y, mutatedGenome);
                virion.generationCount = this.generationCount + 1;
                
                // 일부는 즉시 방출, 일부는 숙주 내 잔류
                if (Math.random() < 0.7) {
                    virion.crystallized = true;
                    virion.x += (Math.random() - 0.5) * 40;
                    virion.y += (Math.random() - 0.5) * 40;
                }
                
                environment.addEntity(virion);
            }
            
            this.offspringCount += replicationCount;
            
            // 숙주 사망 확률
            if (host.energy <= 5 || Math.random() < 0.1) {
                host.dead = true;
                this.infected_host_id = null;
                this.crystallized = true;
            }
        }
    }
    
    getDistance(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getDisplayInfo() {
        const info = {
            'ID': this.id.substr(-6),
            'Type': this.type.toUpperCase(),
            'Age': this.age,
            'Energy': this.energy.toFixed(1),
            'Generation': this.generationCount,
            'Offspring': this.offspringCount
        };
        
        if (this.type === 'virus') {
            info['Crystallized'] = this.crystallized ? 'Yes' : 'No';
            info['Infections'] = this.infectionCount;
        }
        
        return info;
    }
    
    // AI 에이전트가 사용할 관찰 데이터
    getObservation(environment) {
        const sensorRange = this.genome.genes.sensor_range * 20;
        
        return {
            // 자신의 상태
            self: {
                energy: this.energy / this.maxEnergy,
                age: Math.min(this.age / 1000, 1),
                x: this.x / 800,
                y: this.y / 600,
                canDivide: this.canDivide() ? 1 : 0
            },
            
            // 주변 환경 (5x5 그리드)
            environment: this.scanEnvironment(environment, sensorRange),
            
            // 유전자 정보
            genes: { ...this.genome.genes }
        };
    }
    
    scanEnvironment(environment, range) {
        const grid = [];
        const gridSize = 5;
        const cellSize = (range * 2) / gridSize;
        
        for (let i = 0; i < gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < gridSize; j++) {
                const x = this.x - range + (i + 0.5) * cellSize;
                const y = this.y - range + (j + 0.5) * cellSize;
                
                grid[i][j] = {
                    nutrition: environment.getNutritionAt(x, y),
                    entities: environment.getEntitiesNear(x, y, cellSize / 2).length,
                    hosts: environment.getHostsNear(x, y, cellSize / 2).length
                };
            }
        }
        
        return grid;
    }
}