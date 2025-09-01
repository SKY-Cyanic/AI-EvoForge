// 렌더링 시스템 - EvoForge
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 렌더링 설정
        this.showNutritionMap = true;
        this.showTrails = false;
        this.showSensorRange = false;
        
        // 색상 팔레트
        this.colors = {
            bacteria: {
                default: '#4CAF50',
                selected: '#8BC34A',
                dead: '#795548'
            },
            virus: {
                default: '#f44336',
                crystallized: '#E1BEE7',
                selected: '#FF5722'
            },
            host: {
                default: '#2196F3',
                infected: '#FF9800',
                dead: '#607D8B'
            },
            nutrition: {
                low: 'rgba(139, 195, 74, 0.1)',
                medium: 'rgba(139, 195, 74, 0.3)',
                high: 'rgba(139, 195, 74, 0.6)'
            },
            antibiotic: 'rgba(244, 67, 54, 0.3)'
        };
        
        // 파티클 시스템
        this.particles = [];
        
        // 애니메이션 프레임 카운터
        this.frameCount = 0;
    }
    
    clear() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.frameCount++;
    }
    
    renderNutritionMap(nutritionGrid, gridSize) {
        if (!this.showNutritionMap) return;
        
        for (let i = 0; i < nutritionGrid.length; i++) {
            for (let j = 0; j < nutritionGrid[i].length; j++) {
                const nutrition = nutritionGrid[i][j];
                const x = j * gridSize;
                const y = i * gridSize;
                
                if (nutrition > 0) {
                    let color;
                    if (nutrition < 3) {
                        color = this.colors.nutrition.low;
                    } else if (nutrition < 7) {
                        color = this.colors.nutrition.medium;
                    } else {
                        color = this.colors.nutrition.high;
                    }
                    
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x, y, gridSize, gridSize);
                    
                    // 높은 영양 지역에 반짝임 효과
                    if (nutrition > 8 && Math.sin(this.frameCount * 0.1) > 0.5) {
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        this.ctx.fillRect(x, y, gridSize, gridSize);
                    }
                }
            }
        }
    }
    
    renderHost(host) {
        if (host.dead) return;
        
        const x = host.x;
        const y = host.y;
        const size = 12 + (host.energy / host.maxEnergy) * 8;
        
        // 숙주 몸체
        this.ctx.fillStyle = host.infected ? this.colors.host.infected : this.colors.host.default;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 숙주 외곽선
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 에너지 표시 (내부 원)
        const energyRatio = host.energy / host.maxEnergy;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${energyRatio * 0.8})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * energyRatio, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 감염 표시
        if (host.infected) {
            this.ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x + size * 0.6, y - size * 0.6, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // 움직임 표시 (꼬리)
        if (host.mobility > 0.3) {
            this.ctx.strokeStyle = `rgba(33, 150, 243, ${host.mobility})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x - size, y);
            this.ctx.lineTo(x - size * 1.5, y);
            this.ctx.stroke();
        }
    }
    
    renderEntity(entity) {
        if (entity.dead) return;
        
        const x = entity.x;
        const y = entity.y;
        
        if (entity.type === 'bacteria') {
            this.renderBacteria(entity, x, y);
        } else {
            this.renderVirus(entity, x, y);
        }
        
        // 센서 범위 표시 (선택된 엔티티만)
        if (this.showSensorRange && this.selectedEntity === entity) {
            this.renderSensorRange(entity, x, y);
        }
        
        // 에이전트 색상 표시
        if (entity.aiAgent) {
            this.ctx.fillStyle = entity.aiAgent.color;
            this.ctx.beginPath();
            this.ctx.arc(x - 10, y - 10, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    renderBacteria(bacteria, x, y) {
        const baseSize = 6;
        const energySize = (bacteria.energy / 50) * 4;
        const size = baseSize + energySize;
        
        // 박테리아 몸체
        this.ctx.fillStyle = this.colors.bacteria.default;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 유전자 기반 색상 변화
        const metabolism = bacteria.genome.genes.metabolism;
        const resistance = bacteria.genome.genes.resistance;
        
        // 대사율에 따른 밝기
        const brightness = 0.5 + metabolism * 0.5;
        this.ctx.fillStyle = `rgba(76, 175, 80, ${brightness})`;
        this.ctx.fill();
        
        // 내성에 따른 외곽선
        if (resistance > 0.5) {
            this.ctx.strokeStyle = `rgba(255, 193, 7, ${resistance})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // 분열 준비 상태 표시
        if (bacteria.canDivide()) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 2]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, size + 3, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // 이동 방향 표시
        const mobility = bacteria.genome.genes.mobility;
        if (mobility > 0.3) {
            const angle = bacteria.visual.rotation || 0;
            this.ctx.strokeStyle = `rgba(139, 195, 74, ${mobility})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(
                x + Math.cos(angle) * size * 1.5,
                y + Math.sin(angle) * size * 1.5
            );
            this.ctx.stroke();
        }
        
        // 나이 표시 (작은 점들)
        if (bacteria.age > 500) {
            const agePoints = Math.min(Math.floor(bacteria.age / 200), 5);
            for (let i = 0; i < agePoints; i++) {
                const pointAngle = (i / agePoints) * 2 * Math.PI;
                const pointX = x + Math.cos(pointAngle) * (size + 2);
                const pointY = y + Math.sin(pointAngle) * (size + 2);
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(pointX, pointY, 1, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }
    
    renderVirus(virus, x, y) {
        const baseSize = 4;
        const size = baseSize + (virus.genome.genes.capsid_strength * 3);
        
        if (virus.crystallized) {
            // 결정화 상태 렌더링
            this.ctx.fillStyle = this.colors.virus.crystallized;
            this.ctx.strokeStyle = 'rgba(225, 190, 231, 0.8)';
            this.ctx.lineWidth = 1;
            
            // 육각형 모양
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * 2 * Math.PI;
                const pointX = x + Math.cos(angle) * size;
                const pointY = y + Math.sin(angle) * size;
                if (i === 0) {
                    this.ctx.moveTo(pointX, pointY);
                } else {
                    this.ctx.lineTo(pointX, pointY);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // 결정 반짝임 효과
            if (Math.sin(this.frameCount * 0.05) > 0.7) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fill();
            }
        } else {
            // 활성 바이러스 렌더링
            this.ctx.fillStyle = this.colors.virus.default;
            
            // 캡시드 구조 (별 모양)
            this.ctx.beginPath();
            const spikes = 8;
            for (let i = 0; i < spikes * 2; i++) {
                const angle = (i / (spikes * 2)) * 2 * Math.PI;
                const radius = i % 2 === 0 ? size : size * 0.5;
                const pointX = x + Math.cos(angle) * radius;
                const pointY = y + Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(pointX, pointY);
                } else {
                    this.ctx.lineTo(pointX, pointY);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // 숙주 특이성에 따른 색상 변화
            const specificity = virus.genome.genes.host_specificity;
            this.ctx.fillStyle = `rgba(244, 67, 54, ${specificity})`;
            this.ctx.fill();
        }
        
        // 감염 상태 표시
        if (virus.infected_host_id) {
            this.ctx.strokeStyle = 'rgba(255, 152, 0, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // 증식 효과
            if (Math.sin(this.frameCount * 0.2) > 0) {
                this.ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
        
        // 복제율 표시 (작은 점들)
        const replicationRate = virus.genome.genes.replication_rate;
        if (replicationRate > 0.7) {
            const points = Math.floor(replicationRate * 4);
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * 2 * Math.PI + this.frameCount * 0.1;
                const pointX = x + Math.cos(angle) * (size + 6);
                const pointY = y + Math.sin(angle) * (size + 6);
                
                this.ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(pointX, pointY, 1, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }
    
    renderSensorRange(entity, x, y) {
        const range = entity.genome.genes.sensor_range * 20;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, range, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    renderAntibioticEffect(level) {
        this.ctx.fillStyle = `rgba(244, 67, 54, ${level * 0.1})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 항생제 입자 효과
        for (let i = 0; i < level * 20; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 3 + 1;
            
            this.ctx.fillStyle = `rgba(244, 67, 54, ${Math.random() * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    highlightEntity(entity) {
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(entity.x, entity.y, 15, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // 정보 툴팁
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(entity.x + 20, entity.y - 10, 120, 20);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
            `${entity.type} (E: ${entity.energy.toFixed(1)})`,
            entity.x + 25,
            entity.y + 5
        );
    }
    
    renderUI(stats, fps) {
        // FPS 표시
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 100, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`FPS: ${fps.toFixed(1)}`, 15, 30);
        
        // 항생제 레벨 표시
        if (stats.antibioticLevel > 0) {
            this.ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
            this.ctx.fillRect(10, 50, 100, 20);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(
                `Antibiotic: ${(stats.antibioticLevel * 100).toFixed(1)}%`,
                15,
                65
            );
        }
    }
    
    renderAgentInfo(agents) {
        const startY = this.height - 100;
        
        agents.forEach((agent, index) => {
            const y = startY + index * 25;
            
            // 에이전트 색상 표시
            this.ctx.fillStyle = agent.color;
            this.ctx.fillRect(10, y, 15, 15);
            
            // 에이전트 정보
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(
                `${agent.name}: ${agent.controlledEntities.length} entities`,
                30,
                y + 12
            );
        });
    }
    
    // 파티클 효과 (감염, 분열 등)
    addParticle(x, y, type) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            maxLife: 30,
            type: type,
            size: Math.random() * 3 + 1
        };
        
        this.particles.push(particle);
    }
    
    updateAndRenderParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            
            const alpha = particle.life / particle.maxLife;
            
            if (particle.type === 'division') {
                this.ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
            } else if (particle.type === 'infection') {
                this.ctx.fillStyle = `rgba(244, 67, 54, ${alpha})`;
            } else {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, 2 * Math.PI);
            this.ctx.fill();
            
            return particle.life > 0;
        });
    }
    
    // 렌더링 옵션 토글
    toggleNutritionMap() {
        this.showNutritionMap = !this.showNutritionMap;
    }
    
    toggleSensorRange() {
        this.showSensorRange = !this.showSensorRange;
    }
    
    toggleTrails() {
        this.showTrails = !this.showTrails;
    }
}