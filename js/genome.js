// 유전자 시스템 - EvoForge
class Genome {
    constructor(genes = null) {
        if (genes) {
            this.genes = { ...genes };
        } else {
            this.genes = this.generateRandomGenes();
        }
        this.length = 256;
        this.encoding = 'base4';
        this.rna_or_dna = Math.random() > 0.5 ? 'DNA' : 'RNA';
    }
    
    generateRandomGenes() {
        return {
            metabolism: Math.random(),
            replication_rate: Math.random(),
            capsid_strength: Math.random(),
            host_specificity: Math.random(),
            resistance: Math.random(),
            mobility: Math.random(),
            sensor_range: Math.floor(Math.random() * 5) + 1
        };
    }
    
    mutate(mutationRate = 0.005) {
        const mutatedGenes = { ...this.genes };
        
        for (const [key, value] of Object.entries(mutatedGenes)) {
            if (Math.random() < mutationRate) {
                if (key === 'sensor_range') {
                    // 정수형 유전자
                    mutatedGenes[key] = Math.max(1, Math.min(6, value + (Math.random() > 0.5 ? 1 : -1)));
                } else {
                    // 실수형 유전자 (가우시안 노이즈)
                    const noise = (Math.random() - 0.5) * 0.1; // ±5% 변화
                    mutatedGenes[key] = Math.max(0, Math.min(1, value + noise));
                }
            }
        }
        
        return new Genome(mutatedGenes);
    }
    
    crossover(otherGenome) {
        const childGenes = {};
        
        for (const key of Object.keys(this.genes)) {
            // 50% 확률로 각 부모의 유전자 선택
            childGenes[key] = Math.random() > 0.5 ? this.genes[key] : otherGenome.genes[key];
        }
        
        return new Genome(childGenes);
    }
    
    similarity(otherGenome) {
        let totalDiff = 0;
        let count = 0;
        
        for (const key of Object.keys(this.genes)) {
            if (key !== 'sensor_range') {
                totalDiff += Math.abs(this.genes[key] - otherGenome.genes[key]);
                count++;
            }
        }
        
        return 1 - (totalDiff / count); // 1에 가까울수록 유사
    }
    
    getFitnessScore() {
        // 유전자 조합에 따른 적합도 점수
        const { metabolism, replication_rate, resistance, mobility } = this.genes;
        return (metabolism * 0.3) + (replication_rate * 0.3) + (resistance * 0.2) + (mobility * 0.2);
    }
    
    getDisplayInfo() {
        return {
            'Metabolism': (this.genes.metabolism * 100).toFixed(1) + '%',
            'Replication': (this.genes.replication_rate * 100).toFixed(1) + '%',
            'Capsid Strength': (this.genes.capsid_strength * 100).toFixed(1) + '%',
            'Host Specificity': (this.genes.host_specificity * 100).toFixed(1) + '%',
            'Resistance': (this.genes.resistance * 100).toFixed(1) + '%',
            'Mobility': (this.genes.mobility * 100).toFixed(1) + '%',
            'Sensor Range': this.genes.sensor_range.toString(),
            'Type': this.rna_or_dna
        };
    }
}

// 수평 유전자 전달 (HGT) 시스템
class HorizontalGeneTransfer {
    static canTransfer(entity1, entity2, distance, hgtProbability = 0.0005) {
        // 박테리아 간에만 HGT 가능
        if (entity1.type !== 'bacteria' || entity2.type !== 'bacteria') {
            return false;
        }
        
        // 거리 제한 (근접해야 함)
        if (distance > 50) {
            return false;
        }
        
        return Math.random() < hgtProbability;
    }
    
    static transfer(donor, recipient) {
        // 랜덤하게 1-2개의 유전자를 전달
        const geneKeys = Object.keys(donor.genome.genes);
        const transferCount = Math.floor(Math.random() * 2) + 1;
        const genesToTransfer = [];
        
        for (let i = 0; i < transferCount; i++) {
            const randomGene = geneKeys[Math.floor(Math.random() * geneKeys.length)];
            if (!genesToTransfer.includes(randomGene)) {
                genesToTransfer.push(randomGene);
            }
        }
        
        // 유전자 전달 실행
        genesToTransfer.forEach(gene => {
            recipient.genome.genes[gene] = donor.genome.genes[gene];
        });
        
        return genesToTransfer;
    }
}

// 진화 통계 추적
class EvolutionTracker {
    constructor() {
        this.history = [];
        this.geneFrequencies = {};
        this.fitnessHistory = [];
    }
    
    recordGeneration(entities) {
        const snapshot = {
            tick: Date.now(),
            totalEntities: entities.length,
            bacteriaCount: entities.filter(e => e.type === 'bacteria').length,
            virusCount: entities.filter(e => e.type === 'virus').length,
            averageFitness: this.calculateAverageFitness(entities),
            geneDistribution: this.calculateGeneDistribution(entities)
        };
        
        this.history.push(snapshot);
        
        // 최대 1000개 기록만 유지
        if (this.history.length > 1000) {
            this.history.shift();
        }
    }
    
    calculateAverageFitness(entities) {
        if (entities.length === 0) return 0;
        
        const totalFitness = entities.reduce((sum, entity) => {
            return sum + entity.genome.getFitnessScore();
        }, 0);
        
        return totalFitness / entities.length;
    }
    
    calculateGeneDistribution(entities) {
        if (entities.length === 0) return {};
        
        const distribution = {};
        const geneKeys = Object.keys(entities[0].genome.genes);
        
        geneKeys.forEach(gene => {
            const values = entities.map(e => e.genome.genes[gene]);
            distribution[gene] = {
                mean: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                std: this.calculateStandardDeviation(values)
            };
        });
        
        return distribution;
    }
    
    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }
    
    getEvolutionTrends() {
        if (this.history.length < 2) return null;
        
        const recent = this.history.slice(-10); // 최근 10개 기록
        const first = recent[0];
        const last = recent[recent.length - 1];
        
        return {
            populationChange: last.totalEntities - first.totalEntities,
            fitnessChange: last.averageFitness - first.averageFitness,
            diversityTrend: this.calculateDiversityTrend(recent)
        };
    }
    
    calculateDiversityTrend(snapshots) {
        // 유전적 다양성 변화 추적
        return snapshots.map(snapshot => {
            const genes = snapshot.geneDistribution;
            let totalVariance = 0;
            let geneCount = 0;
            
            for (const gene of Object.values(genes)) {
                totalVariance += gene.std;
                geneCount++;
            }
            
            return geneCount > 0 ? totalVariance / geneCount : 0;
        });
    }
}