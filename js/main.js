// EvoForge 메인 애플리케이션
class EvoForgeApp {
    constructor() {
        this.simulation = null;
        this.ui = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            console.log('🧬 EvoForge 초기화 중...');
            
            // 시뮬레이션 초기화
            this.simulation = new Simulation('simulation-canvas');
            console.log('✅ 시뮬레이션 엔진 로드 완료');
            
            // UI 컨트롤러 초기화
            this.ui = new UIController(this.simulation);
            console.log('✅ UI 컨트롤러 로드 완료');
            
            // UI 초기화
            this.ui.initialize();
            console.log('✅ UI 초기화 완료');
            
            // 이벤트 리스너 설정
            this.setupGlobalEventListeners();
            console.log('✅ 이벤트 리스너 설정 완료');
            
            // 성능 모니터링 시작
            this.startPerformanceMonitoring();
            console.log('✅ 성능 모니터링 시작');
            
            this.isInitialized = true;
            console.log('🎉 EvoForge 초기화 완료!');
            
            // 초기화 완료 후 자동 시작 (선택사항)
            // this.simulation.start();
            
        } catch (error) {
            console.error('❌ EvoForge 초기화 실패:', error);
            this.showCriticalError(error);
        }
    }
    
    setupGlobalEventListeners() {
        // 창 크기 변경 대응
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // 에러 처리
        window.addEventListener('error', (event) => {
            console.error('전역 에러:', event.error);
            this.handleGlobalError(event.error);
        });
        
        // 브라우저 가시성 변경 (탭 전환 등)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 탭이 숨겨졌을 때 성능 최적화
                this.onPageHidden();
            } else {
                // 탭이 다시 보일 때 복원
                this.onPageVisible();
            }
        });
    }
    
    handleResize() {
        if (!this.isInitialized) return;
        
        // 반응형 레이아웃 조정
        const canvas = this.simulation.canvas;
        const container = canvas.parentElement;
        
        // 모바일 화면에서 캔버스 크기 조정
        if (window.innerWidth < 768) {
            canvas.width = Math.min(600, window.innerWidth - 40);
            canvas.height = canvas.width * 0.75;
        } else {
            canvas.width = 800;
            canvas.height = 600;
        }
        
        // 환경 크기도 업데이트
        this.simulation.environment.width = canvas.width;
        this.simulation.environment.height = canvas.height;
        
        console.log(`화면 크기 조정: ${canvas.width}x${canvas.height}`);
    }
    
    onPageHidden() {
        // 탭이 숨겨졌을 때 시뮬레이션 속도 감소
        if (this.simulation && this.simulation.isRunning) {
            this.simulation.setSpeed(1); // 최소 속도로 변경
            console.log('탭 숨김: 시뮬레이션 속도 감소');
        }
    }
    
    onPageVisible() {
        // 탭이 다시 보일 때 원래 속도 복원
        if (this.simulation && this.simulation.isRunning) {
            const speedSlider = document.getElementById('speed-slider');
            const speed = parseInt(speedSlider.value);
            this.simulation.setSpeed(speed);
            console.log('탭 복원: 시뮬레이션 속도 복원');
        }
    }
    
    startPerformanceMonitoring() {
        setInterval(() => {
            if (this.simulation && this.simulation.isRunning) {
                const stats = this.simulation.environment.getStatistics();
                const fps = this.simulation.actualFPS;
                
                // 성능 경고
                if (fps < 30 && stats.totalEntities > 100) {
                    console.warn(`성능 경고: FPS ${fps.toFixed(1)}, 엔티티 ${stats.totalEntities}개`);
                    
                    // 자동 성능 최적화
                    if (stats.totalEntities > 500) {
                        this.ui.showNotification('개체 수가 많아 성능을 최적화합니다', 'warning');
                        this.optimizePerformance();
                    }
                }
                
                // 메모리 사용량 체크 (가능한 경우)
                if (performance.memory) {
                    const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
                    if (memoryUsage > 100) { // 100MB 초과
                        console.warn(`메모리 사용량 경고: ${memoryUsage.toFixed(1)}MB`);
                    }
                }
            }
        }, 5000); // 5초마다 체크
    }
    
    optimizePerformance() {
        if (!this.simulation) return;
        
        // 개체 수 제한
        const entities = this.simulation.environment.entities;
        if (entities.length > 300) {
            // 오래된 개체부터 제거
            entities.sort((a, b) => b.age - a.age);
            const toRemove = entities.slice(300);
            toRemove.forEach(entity => {
                entity.dead = true;
            });
            
            console.log(`성능 최적화: ${toRemove.length}개 개체 제거`);
        }
        
        // 렌더링 최적화
        this.simulation.renderer.showNutritionMap = false;
        document.getElementById('show-nutrition').checked = false;
    }
    
    handleGlobalError(error) {
        console.error('처리되지 않은 에러:', error);
        
        // 시뮬레이션이 실행 중이면 일시정지
        if (this.simulation && this.simulation.isRunning) {
            this.simulation.pause();
        }
        
        // 사용자에게 알림
        if (this.ui) {
            this.ui.showNotification('오류가 발생했습니다. 시뮬레이션이 일시정지됩니다.', 'error');
        }
    }
    
    showCriticalError(error) {
        // 치명적 오류 표시
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            z-index: 9999;
            max-width: 400px;
        `;
        
        errorDiv.innerHTML = `
            <h2>❌ 초기화 실패</h2>
            <p>EvoForge를 시작할 수 없습니다.</p>
            <p style="font-size: 0.9em; opacity: 0.8; margin-top: 1rem;">
                ${error.message}
            </p>
            <button onclick="location.reload()" style="
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: white;
                color: #f44336;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            ">
                새로고침
            </button>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    cleanup() {
        console.log('🧹 EvoForge 정리 중...');
        
        if (this.simulation) {
            this.simulation.stop();
        }
        
        if (this.ui) {
            this.ui.stopStatsUpdater();
        }
        
        console.log('✅ 정리 완료');
    }
    
    // 개발자 도구용 디버그 메서드들
    debug() {
        return {
            simulation: this.simulation,
            environment: this.simulation?.environment,
            entities: this.simulation?.environment?.entities,
            agents: this.simulation?.agents,
            tournament: this.simulation?.tournament,
            
            // 유용한 디버그 함수들
            addBacteria: (count = 10) => {
                for (let i = 0; i < count; i++) {
                    const bacteria = new Entity(
                        'bacteria',
                        Math.random() * this.simulation.environment.width,
                        Math.random() * this.simulation.environment.height
                    );
                    this.simulation.environment.addEntity(bacteria);
                }
                console.log(`${count}개의 박테리아 추가됨`);
            },
            
            addViruses: (count = 5) => {
                for (let i = 0; i < count; i++) {
                    const virus = new Entity(
                        'virus',
                        Math.random() * this.simulation.environment.width,
                        Math.random() * this.simulation.environment.height
                    );
                    virus.crystallized = true;
                    this.simulation.environment.addEntity(virus);
                }
                console.log(`${count}개의 바이러스 추가됨`);
            },
            
            killAll: (type) => {
                const entities = this.simulation.environment.entities;
                let killed = 0;
                entities.forEach(entity => {
                    if (!type || entity.type === type) {
                        entity.dead = true;
                        killed++;
                    }
                });
                console.log(`${killed}개의 ${type || '모든'} 엔티티 제거됨`);
            },
            
            setMutationRate: (rate) => {
                this.simulation.mutationRate = rate;
                console.log(`돌연변이율 설정: ${rate}`);
            },
            
            deployAntibiotic: (strength = 5.0) => {
                const env = this.simulation.environment;
                env.deployAntibiotic(
                    env.width / 2,
                    env.height / 2,
                    100,
                    strength
                );
                console.log(`항생제 투입: 강도 ${strength}`);
            }
        };
    }
}

// 전역 앱 인스턴스
let app;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 EvoForge 시작');
    
    try {
        app = new EvoForgeApp();
        await app.initialize();
        
        // 개발자 도구에서 접근 가능하도록 전역 변수로 설정
        window.evoforge = app.debug();
        
        console.log('💡 개발자 도구에서 "evoforge" 객체를 사용하여 디버깅할 수 있습니다.');
        
    } catch (error) {
        console.error('앱 시작 실패:', error);
    }
});

// 서비스 워커 등록 (PWA 지원, 선택사항)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}