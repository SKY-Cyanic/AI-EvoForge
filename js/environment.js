// 환경 시스템 - EvoForge
class Environment {
    constructor(width = 800, height = 600) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.hosts = [];
        
        // 영양 맵 (2D 그리드)
        this.gridSize = 20;
        this.nutritionGrid = this.initializeNutritionGrid();
        
        // 환경 변수
        this.nutritionLevel = 1.0;
        this.antibioticLevel = 0.0;
        this.temperature = 1.0;
        
        // 통계
        this.tickCount = 0;
        this.totalBorn = 0;
        this.totalDied = 0;
        
        // 이벤트 로그
        this.eventLog = [];
        
        // 초기 숙주 생성
        this.generateHosts(20);
    }
    
    initializeNutritionGrid() {
        const grid = [];
        const cols = Math.ceil(this.width / this.gridSize);
        const rows = Math.ceil(this.height / this.gridSize);
        
        for (let i = 0; i < rows; i++) {
            grid[i] = [];
            for (let j = 0; j < cols; j++) {
                // 패치 형태의 영양 분포 (클러스터링)
                const centerX = j * this.gridSize + this.gridSize / 2;
                const centerY = i * this.gridSize + this.gridSize / 2;
                
                // 여러 영양 핫스팟 생성
                let nutrition = 0;
                const hotspots = [
                    { x: this.width * 0.2, y: this.height * 0.3, strength: 10 },
                    { x: this.width * 0.7, y: this.height * 0.2, strength: 8 },
                    { x: this.width * 0.5, y: this.height * 0.8, strength: 12 },
                    { x: this.width * 0.1, y: this.height * 0.7, strength: 6 }
                ];
                
                hotspots.forEach(hotspot => {
                    const distance = Math.sqrt(
                        Math.pow(centerX - hotspot.x, 2) + 
                        Math.pow(centerY - hotspot.y, 2)
                    );
                    const influence = Math.max(0, hotspot.strength * Math.exp(-distance / 100));
                    nutrition += influence;
                });
                
                // 기본 영양 + 노이즈
                nutrition += 1 + Math.random() * 2;
                grid[i][j] = Math.max(0, nutrition);
            }
        }
        
        return grid;
    }
    
    generateHosts(count) {
        for (let i = 0; i < count; i++) {
            const host = {
                id: 'host_' + Math.random().toString(36).substr(2, 9),
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                energy: 50 + Math.random() * 50,
                maxEnergy: 100,
                genome: new Genome(), // 숙주도 유전자를 가짐
                infected: false,
                age: 0,
                dead: false,
                mobility: Math.random() * 0.5 + 0.1
            };
            this.hosts.push(host);
        }
    }
    
    update() {
        this.tickCount++;
        
        // 엔티티 업데이트
        this.entities.forEach(entity => {
            if (!entity.dead) {
                entity.update(this);
            }
        });
        
        // 숙주 업데이트
        this.updateHosts();
        
        // 죽은 엔티티 제거
        const aliveBefore = this.entities.length;
        this.entities = this.entities.filter(entity => !entity.dead);
        const deadCount = aliveBefore - this.entities.length;
        this.totalDied += deadCount;
        
        // 죽은 숙주 제거 및 새 숙주 생성
        const deadHosts = this.hosts.filter(host => host.dead);
        this.hosts = this.hosts.filter(host => !host.dead);
        
        // 숙주 개체수 유지
        if (this.hosts.length < 15) {
            this.generateHosts(Math.min(5, 20 - this.hosts.length));
        }
        
        // 영양 재생성
        this.regenerateNutrition();
        
        // 수평 유전자 전달 처리
        this.processHorizontalGeneTransfer();
        
        // 환경 스트레스 적용
        this.applyEnvironmentalStress();
        
        // 이벤트 로그 정리 (최근 100개만 유지)
        if (this.eventLog.length > 100) {
            this.eventLog = this.eventLog.slice(-100);
        }
    }
    
    updateHosts() {
        this.hosts.forEach(host => {
            host.age++;
            
            // 숙주 이동 (천천히)
            if (Math.random() < host.mobility) {
                host.x += (Math.random() - 0.5) * 20;
                host.y += (Math.random() - 0.5) * 20;
                
                // 경계 체크
                host.x = Math.max(20, Math.min(this.width - 20, host.x));
                host.y = Math.max(20, Math.min(this.height - 20, host.y));
            }
            
            // 숙주 에너지 회복 (천천히)
            if (host.energy < host.maxEnergy && Math.random() < 0.1) {
                host.energy = Math.min(host.maxEnergy, host.energy + 1);
            }
            
            // 나이에 따른 자연사
            if (host.age > 2000 && Math.random() < 0.001) {
                host.dead = true;
            }
            
            // 에너지 부족으로 인한 사망
            if (host.energy <= 0) {
                host.dead = true;
            }
        });
    }
    
    regenerateNutrition() {
        // 영양 자연 재생성
        for (let i = 0; i < this.nutritionGrid.length; i++) {
            for (let j = 0; j < this.nutritionGrid[i].length; j++) {
                if (this.nutritionGrid[i][j] < 10 && Math.random() < 0.05) {
                    this.nutritionGrid[i][j] += 0.5 * this.nutritionLevel;
                }
            }
        }
    }
    
    processHorizontalGeneTransfer() {
        const bacteria = this.entities.filter(e => e.type === 'bacteria');
        
        for (let i = 0; i < bacteria.length; i++) {
            for (let j = i + 1; j < bacteria.length; j++) {
                const distance = bacteria[i].getDistance(bacteria[j]);
                
                if (HorizontalGeneTransfer.canTransfer(bacteria[i], bacteria[j], distance)) {
                    const transferredGenes = HorizontalGeneTransfer.transfer(bacteria[i], bacteria[j]);
                    
                    this.logEvent({
                        type: 'hgt',
                        tick: this.tickCount,
                        donor: bacteria[i].id,
                        recipient: bacteria[j].id,
                        genes: transferredGenes
                    });
                }
            }
        }
    }
    
    applyEnvironmentalStress() {
        if (this.antibioticLevel > 0) {
            this.entities.forEach(entity => {
                if (entity.type === 'bacteria') {
                    const damage = this.antibioticLevel * (1 - entity.genome.genes.resistance);
                    entity.energy = Math.max(0, entity.energy - damage);
                    
                    if (damage > 0.5) {
                        this.logEvent({
                            type: 'antibiotic_damage',
                            tick: this.tickCount,
                            entity: entity.id,
                            damage: damage
                        });
                    }
                }
            });
            
            // 항생제 농도 감소
            this.antibioticLevel = Math.max(0, this.antibioticLevel - 0.01);
        }
    }
    
    addEntity(entity) {
        this.entities.push(entity);
        this.totalBorn++;
    }
    
    getEntityById(id) {
        return this.entities.find(entity => entity.id === id) || 
               this.hosts.find(host => host.id === id);
    }
    
    getNutritionAt(x, y) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        
        if (row >= 0 && row < this.nutritionGrid.length && 
            col >= 0 && col < this.nutritionGrid[row].length) {
            return this.nutritionGrid[row][col];
        }
        
        return 0;
    }
    
    consumeNutrition(x, y, amount) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        
        if (row >= 0 && row < this.nutritionGrid.length && 
            col >= 0 && col < this.nutritionGrid[row].length) {
            this.nutritionGrid[row][col] = Math.max(0, this.nutritionGrid[row][col] - amount);
        }
    }
    
    getEntitiesNear(x, y, radius) {
        return this.entities.filter(entity => {
            const distance = Math.sqrt(
                Math.pow(entity.x - x, 2) + 
                Math.pow(entity.y - y, 2)
            );
            return distance <= radius && !entity.dead;
        });
    }
    
    getHostsNear(x, y, radius) {
        return this.hosts.filter(host => {
            const distance = Math.sqrt(
                Math.pow(host.x - x, 2) + 
                Math.pow(host.y - y, 2)
            );
            return distance <= radius && !host.dead;
        });
    }
    
    deployAntibiotic(x, y, radius = 100, strength = 5.0) {
        this.antibioticLevel = Math.max(this.antibioticLevel, strength);
        
        // 지역적 항생제 효과
        const affectedEntities = this.getEntitiesNear(x, y, radius);
        affectedEntities.forEach(entity => {
            if (entity.type === 'bacteria') {
                const distance = Math.sqrt(
                    Math.pow(entity.x - x, 2) + 
                    Math.pow(entity.y - y, 2)
                );
                const effectStrength = strength * (1 - distance / radius);
                const damage = effectStrength * (1 - entity.genome.genes.resistance);
                entity.energy = Math.max(0, entity.energy - damage);
            }
        });
        
        this.logEvent({
            type: 'antibiotic_deployment',
            tick: this.tickCount,
            x: x,
            y: y,
            radius: radius,
            strength: strength,
            affected: affectedEntities.length
        });
    }
    
    getStatistics() {
        const bacteriaCount = this.entities.filter(e => e.type === 'bacteria').length;
        const virusCount = this.entities.filter(e => e.type === 'virus').length;
        const crystallizedViruses = this.entities.filter(e => e.type === 'virus' && e.crystallized).length;
        
        return {
            tickCount: this.tickCount,
            totalEntities: this.entities.length,
            bacteriaCount: bacteriaCount,
            virusCount: virusCount,
            crystallizedViruses: crystallizedViruses,
            hostCount: this.hosts.length,
            totalBorn: this.totalBorn,
            totalDied: this.totalDied,
            antibioticLevel: this.antibioticLevel,
            nutritionLevel: this.nutritionLevel
        };
    }
    
    getPopulationHistory() {
        // 최근 100틱의 개체수 변화
        return this.eventLog
            .filter(event => event.type === 'population_snapshot')
            .slice(-100)
            .map(event => ({
                tick: event.tick,
                bacteria: event.bacteria,
                virus: event.virus,
                host: event.host
            }));
    }
    
    logEvent(event) {
        this.eventLog.push({
            ...event,
            timestamp: Date.now()
        });
    }
    
    // 매 10틱마다 개체수 스냅샷 저장
    takePopulationSnapshot() {
        if (this.tickCount % 10 === 0) {
            this.logEvent({
                type: 'population_snapshot',
                tick: this.tickCount,
                bacteria: this.entities.filter(e => e.type === 'bacteria').length,
                virus: this.entities.filter(e => e.type === 'virus').length,
                host: this.hosts.length
            });
        }
    }
    
    // 초기 개체군 생성
    populateInitial(bacteriaCount = 30, virusCount = 10) {
        // 박테리아 생성
        for (let i = 0; i < bacteriaCount; i++) {
            const bacteria = new Entity(
                'bacteria',
                Math.random() * this.width,
                Math.random() * this.height
            );
            this.addEntity(bacteria);
        }
        
        // 바이러스 생성
        for (let i = 0; i < virusCount; i++) {
            const virus = new Entity(
                'virus',
                Math.random() * this.width,
                Math.random() * this.height
            );
            virus.crystallized = true; // 초기에는 결정화 상태
            this.addEntity(virus);
        }
    }
    
    // 환경 리셋
    reset() {
        this.entities = [];
        this.hosts = [];
        this.eventLog = [];
        this.tickCount = 0;
        this.totalBorn = 0;
        this.totalDied = 0;
        this.antibioticLevel = 0;
        
        // 영양 그리드 재생성
        this.nutritionGrid = this.initializeNutritionGrid();
        
        // 새로운 숙주 생성
        this.generateHosts(20);
        
        // 초기 개체군 생성
        this.populateInitial();
    }
}