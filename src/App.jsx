import React, { useState } from 'react';
import { Graph } from 'react-d3-graph';
import { Button, Modal, Form, Container, Navbar, Nav, Offcanvas } from 'react-bootstrap';

const testGraph = {
	"nodes": [
		{
			"id": "1",
			"distance": 9
		},
		{
			"id": "2",
			"distance": 13
		},
		{
			"id": "3",
			"distance": 11
		},
		{
			"id": "4",
			"distance": 2
		},
		{
			"id": "3",
			"distance": 17
		},
		{
			"id": "4",
			"distance": 5
		},
		{
			"id": "5",
			"distance": 13
		},
		{
			"id": "5",
			"distance": 9
		},
		{
			"id": "5",
			"distance": 7
		}
	],
	"links": [
		{
			"source": "1",
			"target": "2",
			"capacity": 20,
			"maxCapacity": 20,
			"label": "2 км (20)"
		},
		{
			"source": "1",
			"target": "3",
			"capacity": 15,
			"maxCapacity": 15,
			"label": "4 км (15)"
		},
		{
			"source": "1",
			"target": "4",
			"capacity": 30,
			"maxCapacity": 30,
			"label": "3 км (30)"
		},
		{
			"source": "2",
			"target": "3",
			"capacity": 40,
			"maxCapacity": 40,
			"label": "2 км (40)"
		},
		{
			"source": "3",
			"target": "4",
			"capacity": 20,
			"maxCapacity": 20,
			"label": "6 км (20)"
		},
		{
			"source": "2",
			"target": "5",
			"capacity": 50,
			"maxCapacity": 50,
			"label": "7 км (50)"
		},
		{
			"source": "3",
			"target": "5",
			"capacity": 30,
			"maxCapacity": 30,
			"label": "9 км (30)"
		},
		{
			"source": "4",
			"target": "5",
			"capacity": 10,
			"maxCapacity": 10,
			"label": "7 км (10)"
		}
	]
};

const graphConfig = {
	node: {
		color: 'lightblue',
		size: 300,
		fontSize: 24,
		highlightColor: 'lightgreen',
	},
	link: {
		highlightColor: 'lightblue',
		renderLabel: true,
		fontSize: 18,
	},
	directed: true,
	panAndZoom: true,
	width: window.innerWidth,
	height: window.innerHeight,
};

// Функция для генерации случайных вершин
const generateNodes = (numNodes) => {
	const nodes = [];
	for (let i = 0; i < numNodes; i++) {
		nodes.push({ id: `${i + 1}`, distance: Math.floor(Math.random() * 20) });
	}
	return nodes;
};

// Функция для генерации случайных ребер
const generateLinks = (numNodes, maxCapacity) => {
	const links = [];
	const uniqueLinks = new Set();

	// Вероятность создания ребра между вершинами (0.7 = 70% шанс)
	const edgeProbability = 0.7;

	for (let i = 0; i < numNodes; i++) {
		for (let j = i + 1; j < numNodes; j++) {
			// Решаем, создавать ли ребро между вершинами
			if (Math.random() < edgeProbability) {
				const capacity = Math.floor(Math.random() * maxCapacity) + 1;
				const distance = Math.floor(Math.random() * 10) + 1;
				const linkKey = `${i + 1},${j + 1}`;

				if (!uniqueLinks.has(linkKey)) {
					uniqueLinks.add(linkKey);

					// Добавляем случайность в направление ребра
					const [source, target] = Math.random() < 0.5
						? [`${i + 1}`, `${j + 1}`]
						: [`${j + 1}`, `${i + 1}`];

					links.push({
						source,
						target,
						capacity,
						maxCapacity: capacity,
						label: `${distance} км (${capacity})`,
					});
				}
			}
		}
	}

	// Убедимся, что граф связный
	ensureConnected(links, numNodes);

	return links;
};

// Функция для проверки и обеспечения связности графа
const ensureConnected = (links, numNodes) => {
	const parent = new Array(numNodes + 1).fill(-1);

	// Функция для нахождения корня множества
	const find = (v) => {
		if (parent[v] === -1) return v;
		parent[v] = find(parent[v]);
		return parent[v];
	};

	// Функция для объединения множеств
	const union = (x, y) => {
		const rootX = find(x);
		const rootY = find(y);
		if (rootX !== rootY) {
			parent[rootX] = rootY;
		}
	};

	// Объединяем существующие компоненты
	links.forEach(link => {
		union(parseInt(link.source), parseInt(link.target));
	});

	// Проверяем, есть ли изолированные компоненты
	for (let i = 1; i <= numNodes; i++) {
		if (find(1) !== find(i)) {
			// Добавляем ребро для соединения компонент
			const capacity = Math.floor(Math.random() * 10) + 1;
			const distance = Math.floor(Math.random() * 10) + 1;
			links.push({
				source: `${1}`,
				target: `${i}`,
				capacity,
				maxCapacity: capacity,
				label: `${distance} км (${capacity})`,
			});
			union(1, i);
		}
	}
};

// Основная функция для генерации графа
const generateGraph = (numNodes, maxCapacity) => {
	const nodes = generateNodes(numNodes);
	const links = generateLinks(numNodes, maxCapacity);
	return { nodes, links };
};

function App() {
	const [showGenerateGraphModal, setShowGenerateGraphModal] = useState(false);
	const [graphParams, setGraphParams] = useState({ numNodes: 10, maxCapacity: 10 });

	// const [graphData, setGraphData] = useState(generateGraph(graphParams.numNodes, graphParams.maxCapacity));
	const [graphData, setGraphData] = useState(testGraph);

	const [showAddNodeModal, setShowAddNodeModal] = useState(false);
	const [showRemoveNodeModal, setShowRemoveNodeModal] = useState(false);
	const [showFindMaxFlow, setShowFindMaxFlow] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [results, setResults] = useState(null);

	const [newNode, setNewNode] = useState('');
	const [maxFlowStart, setMaxFlowStart] = useState('');
	const [maxFlowEnd, setMaxFlowEnd] = useState('');
	const [sourceNode, setSourceNode] = useState('');
	// const [targetNode, setTargetNode] = useState('');
	const [capacity, setСapacity] = useState(5);

	// Добавление новой вершины и ребра
	const addNode = () => {
		// Проверяем, что все необходимые поля заполнены
		if (!newNode || !sourceNode || !capacity) return;

		// Проверяем, существует ли sourceNode в узлах
		const sourceExists = graphData.nodes.some(node => node.id === sourceNode);

		// Создаем новый массив узлов, добавляя новый узел
		const updatedNodes = [...graphData.nodes, { id: newNode, distance: Math.floor(Math.random() * 20) }];

		// Создаем новый массив ссылок
		const updatedLinks = [...graphData.links];

		// Если sourceNode не существует, добавляем его
		if (!sourceExists) {
			updatedNodes.push({ id: sourceNode, distance: Math.floor(Math.random() * 20) });
			console.log(`Source node "${sourceNode}" was created.`);
		}

		// Добавляем связь между sourceNode и newNode
		const distance = Math.floor(Math.random() * 10) + 1;
		updatedLinks.push({
			source: sourceNode,
			target: newNode,
			capacity: Number(capacity),
			maxCapacity: Number(capacity),
			label: `${distance} км (${capacity})`,
		});

		// Обновляем состояние графа
		setGraphData({ nodes: updatedNodes, links: updatedLinks });
		setShowAddNodeModal(false);
		setNewNode('');
		setSourceNode('');
		setСapacity(null);
	};

	// Удаление вершины
	const removeNode = (nodeToRemove) => {
		const updatedNodes = graphData.nodes.filter((node) => node.id !== nodeToRemove);
		const updatedLinks = graphData.links.filter(
			(link) => link.source !== nodeToRemove && link.target !== nodeToRemove
		);

		setGraphData({ nodes: updatedNodes, links: updatedLinks });
		setShowRemoveNodeModal(false);
		setSourceNode('');
	};

	// Алгоритм Форда-Фалкерсона
	const fordFulkerson = async (graph, source, sink) => {
		const residualGraph = JSON.parse(JSON.stringify(graph)); // Копия графа для работы с остаточными емкостями
		const parent = {}; // Для хранения пути
		let maxFlow = 0;
		const paths = []; // Массив для хранения всех путей

		// DFS с приоритетом по остаточной пропускной способности
		const dfs = (current, sink, visited) => {
			if (current === sink) return true; // Если достигли стока, путь найден

			visited[current] = true;

			const neighbors = Object.keys(residualGraph[current] || {});
			// Сортируем соседей по остаточной пропускной способности (по убыванию)
			neighbors.sort((a, b) => residualGraph[current][b] - residualGraph[current][a]);

			for (const neighbor of neighbors) {
				if (!visited[neighbor] && residualGraph[current][neighbor] > 0) {
					parent[neighbor] = current; // Сохраняем предка
					if (dfs(neighbor, sink, visited)) {
						return true; // Если путь найден, возвращаем true
					}
				}
			}

			return false; // Если путь не найден
		};

		// Пока существует путь от source до sink
		while (dfs(source, sink, {})) {
			let pathFlow = Infinity;
			const path = []; // Массив для хранения текущего пути

			// Восстанавливаем путь и находим минимальную пропускную способность по пути
			for (let v = sink; v !== source; v = parent[v]) {
				const u = parent[v];
				pathFlow = Math.min(pathFlow, residualGraph[u][v]); // Минимум на пути
				path.push(v);
			}
			path.push(source);
			path.reverse(); // Переворачиваем путь от source к sink

			await visualizePath(graphData, path); // Визуализация текущего пути

			// Обновляем остаточный граф
			for (let v = sink; v !== source; v = parent[v]) {
				const u = parent[v];
				residualGraph[u][v] -= pathFlow; // Уменьшаем пропускную способность по ребру
				residualGraph[v][u] = (residualGraph[v][u] || 0) + pathFlow; // Добавляем поток в обратное ребро
			}

			await updateResidualCapacities(graphData, residualGraph); // Обновляем граф

			maxFlow += pathFlow; // Увеличиваем общий поток
			paths.push(path); // Сохраняем путь
		}

		return { maxFlow, paths }; // Возвращаем результат
	};


	// Новый метод для нахождения максимального потока
	const findMaxFlowFordFulkerson = async (graphData, source, sink) => {
		const adjacencyMatrix = convertGraphToAdjacencyMatrix(graphData.nodes, graphData.links);
		const { maxFlow, paths } = await fordFulkerson(adjacencyMatrix, source, sink);

		// Остаточный граф из fordFulkerson
		const residualGraph = adjacencyMatrix;

		const { reachable, minCutEdges } = findMinCut(residualGraph, source);
		console.log([reachable, minCutEdges])
		await visualizeMinCut(graphData, minCutEdges);

		setShowFindMaxFlow(false);
		setResults({ maxFlow, paths, minCutEdges });
		setShowResults(true);

		return { maxFlow, paths, minCutEdges }; // Возвращаем и максимальный поток, и пути
	};

	// Конвертация данных графа в формат матрицы смежности
	const convertGraphToAdjacencyMatrix = (nodes, links) => {
		const adjacencyMatrix = {};
		nodes.forEach((node) => {
			adjacencyMatrix[node.id] = {};
		});

		links.forEach((link) => {
			adjacencyMatrix[link.source][link.target] = link.capacity;
		});

		return adjacencyMatrix;
	};

	const visualizePath = async (graphData, path, stepIndex) => {
		// Изменяем цвет узлов и ребер для текущего пути
		const updatedNodes = graphData.nodes.map((node) => ({
			...node,
			color: path.includes(node.id) ? 'orange' : 'lightblue',
		}));

		const updatedLinks = graphData.links.map((link) => ({
			...link,
			color: path.includes(link.source) && path.includes(link.target) ? 'red' : 'lightblue',
			strokeWidth: path.includes(link.source) && path.includes(link.target) ? 3 : 1,
		}));

		setGraphData({
			nodes: updatedNodes,
			links: updatedLinks,
		});

		// Ждем перед переходом к следующему шагу
		await new Promise((resolve) => setTimeout(resolve, 500));
	};

	const visualizeMinCut = async (graphData, minCutEdges) => {
		// Изменяем цвет рёбер для минимального разреза
		const updatedLinks = graphData.links.map((link) => ({
			...link,
			color: minCutEdges.some(([u, v]) => link.source === u && link.target === v) ? 'red' : 'lightblue',
			strokeWidth: minCutEdges.some(([u, v]) => link.source === u && link.target === v) ? 3 : 1,
		}));
	
		// Изменяем цвет узлов (если нужно)
		const updatedNodes = graphData.nodes.map((node) => ({
			...node,
			color: 'lightblue', // Узлы могут оставаться того же цвета, если не требуется выделение
		}));
	
		// Обновляем граф с новыми цветами
		setGraphData({
			nodes: updatedNodes,
			links: updatedLinks,
		});
	
		// Ждем перед переходом к следующему шагу
		await new Promise((resolve) => setTimeout(resolve, 1000));
	};
	

	const findMinCut = (residualGraph, source) => {
		const visited = {};
		const reachable = []; // Узлы, которые достижимы из source

		// BFS для поиска достижимых узлов
		const bfs = (current) => {
			const queue = [current];
			visited[current] = true;

			while (queue.length > 0) {
				const node = queue.shift();
				reachable.push(node);

				for (const neighbor of Object.keys(residualGraph[node] || {})) {
					if (!visited[neighbor] && residualGraph[node][neighbor] > 0) {
						visited[neighbor] = true;
						queue.push(neighbor);
					}
				}
			}
		};

		bfs(source);

		// Находим рёбра, которые составляют минимальный разрез
		const minCutEdges = [];
		for (const u of reachable) {
			for (const v of Object.keys(residualGraph[u] || {})) {
				if (!visited[v] && residualGraph[u][v] !== undefined) {
					minCutEdges.push([u, v]); // Ребро из достижимого узла к недостижимому
				}
			}
		}

		return { reachable, minCutEdges };
	};



	const updateResidualCapacities = async (graphData, residualGraph) => {
		const updatedLinks = graphData.links.map((link) => {
			const capacity = residualGraph[link.source][link.target] || 0;
			const maxCapacity = link.maxCapacity; // Предварительно добавить это свойство к ребрам

			// console.log([capacity, maxCapacity, link])
			return {
				...link,
				label: `${maxCapacity - capacity}/${maxCapacity}`, // Отображаем остаток и полную емкость
			};
		});

		setGraphData({
			...graphData,
			links: updatedLinks,
		});
		await new Promise((resolve) => setTimeout(resolve, 1000));
	};




	return (
		<div className="app-container">
			{/* Навбар с адаптивностью */}
			<Navbar bg="light" expand="lg" className="mb-4">
				<Container>
					<Navbar.Brand href="#">Транспортна мережа</Navbar.Brand>
					<Navbar.Toggle aria-controls="offcanvasNavbar" />
					<Navbar.Offcanvas
						id="offcanvasNavbar"
						aria-labelledby="offcanvasNavbarLabel"
						placement="start"
					>
						<Offcanvas.Header closeButton>
							<Offcanvas.Title id="offcanvasNavbarLabel">
								Меню
							</Offcanvas.Title>
						</Offcanvas.Header>
						<Offcanvas.Body>
							<Nav className="flex-grow-1 pe-3">
								<Button
									onClick={() => setShowAddNodeModal(true)}
									className="mb-2"
									variant="outline-primary"
								>
									Додати вершину
								</Button>
								<Button
									onClick={() => setShowRemoveNodeModal(true)}
									className="mb-2"
									variant="outline-primary"
								>
									Видалити вершину
								</Button>
								<Button
									onClick={() => setShowFindMaxFlow(true)}
									className="mb-2"
									variant="outline-primary"
								>
									Знайти максимальний потік
								</Button>
								<Button
									onClick={() => setShowGenerateGraphModal(true)}
									variant="outline-primary"
								>
									Згенерувати граф
								</Button>
							</Nav>
						</Offcanvas.Body>
					</Navbar.Offcanvas>
				</Container>
			</Navbar>

			{/* Контейнер для графа */}
			<Container fluid className="graph-container">
				<Graph id="traffic-network-graph" data={graphData} config={graphConfig} />
			</Container>


			{/* Модальное окно для добавления вершины */}
			<Modal show={showAddNodeModal} onHide={() => setShowAddNodeModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Додати вершину</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group>
							<Form.Label>Ім'я нової вершини</Form.Label>
							<Form.Control
								type="text"
								value={newNode}
								onChange={(e) => setNewNode(e.target.value)}
								placeholder="Наприклад: C"
							/>
						</Form.Group>
						<Form.Group>
							<Form.Label>Вихідна вершина (source)</Form.Label>
							<Form.Control
								type="text"
								value={sourceNode}
								onChange={(e) => setSourceNode(e.target.value)}
								placeholder="Наприклад: A"
							/>
						</Form.Group>
						<Form.Group>
							<Form.Label>Потік</Form.Label>
							<Form.Control
								type="number"
								value={capacity}
								onChange={(e) => setСapacity(e.target.value)}
								placeholder="Наприклад: 10"
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowAddNodeModal(false)}>
						Відмінити
					</Button>
					<Button variant="primary" onClick={addNode}>
						Додати
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Модальное окно для удаления вершины */}
			<Modal show={showRemoveNodeModal} onHide={() => setShowRemoveNodeModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Видалити вершину</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group>
							<Form.Label>Ім'я вершини для видалення</Form.Label>
							<Form.Control
								type="text"
								value={sourceNode}
								onChange={(e) => setSourceNode(e.target.value)}
								placeholder="Наприклад: B"
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowRemoveNodeModal(false)}>
						Відмінити
					</Button>
					<Button variant="danger" onClick={() => removeNode(sourceNode)}>
						Видалити
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Модальное окно для пошуку максимального потоку */}
			<Modal show={showFindMaxFlow} onHide={() => setShowFindMaxFlow(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Пошук максимального потоку</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group>
							<Form.Label>Початок</Form.Label>
							<Form.Control
								type="text"
								value={maxFlowStart}
								onChange={(e) => setMaxFlowStart(e.target.value)}
								placeholder="Наприклад: C"
							/>
						</Form.Group>
						<Form.Group>
							<Form.Label>Кiнець</Form.Label>
							<Form.Control
								type="text"
								value={maxFlowEnd}
								onChange={(e) => setMaxFlowEnd(e.target.value)}
								placeholder="Наприклад: B"
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="primary" onClick={() => findMaxFlowFordFulkerson(graphData, maxFlowStart, maxFlowEnd)}>
						Знайти
					</Button>
				</Modal.Footer>
			</Modal>

			{showGenerateGraphModal && (
				<Modal show onHide={() => setShowGenerateGraphModal(false)}>
					<Modal.Header closeButton>
						<Modal.Title>Генерація нового графа</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<form>
							<div className="mb-3">
								<label htmlFor="numNodes" className="form-label">
									Кількість вершин
								</label>
								<input
									type="number"
									className="form-control"
									id="numNodes"
									value={graphParams.numNodes}
									onChange={(e) => setGraphParams({ ...graphParams, numNodes: Number(e.target.value) })}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="maxCapacity" className="form-label">
									Максимальна пропускна здатність
								</label>
								<input
									type="number"
									className="form-control"
									id="maxCapacity"
									value={graphParams.maxCapacity}
									onChange={(e) => setGraphParams({ ...graphParams, maxCapacity: Number(e.target.value) })}
								/>
							</div>
						</form>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setShowGenerateGraphModal(false)}>
							Скасувати
						</Button>
						<Button
							variant="primary"
							onClick={() => {
								setGraphData(generateGraph(graphParams.numNodes, graphParams.maxCapacity));
								setShowGenerateGraphModal(false);
							}}
						>
							Згенерувати
						</Button>
					</Modal.Footer>
				</Modal>
			)}

			{results && (
				<Modal
					show={showResults}
					onHide={() => setShowResults(false)}
					style={{ content: { width: "500px", margin: "auto" } }}
				>
					<Modal.Header closeButton>
						<Modal.Title>Результаты</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<p><strong>Максимальний потік:</strong> {results.maxFlow}</p>
						<h3>Шляхи:</h3>
						<ul>
							{results.paths.map((path, index) => (
								<li key={index}>Шлях {index + 1}: {path.join(" → ")}</li>
							))}
						</ul>
						<h3>Мінімальний розріз:</h3>
						<ul>
							{results.minCutEdges.map(([u, v], index) => (
								<li key={index}>Ребро: {u} → {v}</li>
							))}
						</ul>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant="primary"
							onClick={() => {
								setShowResults(false);
							}}
						>
							Закрити
						</Button>
					</Modal.Footer>
				</Modal>
			)}




		</div>
	);
}

export default App;
