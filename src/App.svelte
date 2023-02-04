<script>
	import TodoItem from "./Components/TodoItem.svelte";

	/*Set is the interface(collection of values) that has method like
	 add(add some value) ,
	 has(check if that value are already was added)*/
	const taskNames = new Set();

	let finishedList = [];
	let toDoList = [];
	let count = 0;

	const updateToDo = (task) => {
		const data = task ? [...toDoList, task] : [...toDoList];

		toDoList = data;
	};

	const updateFinished = (task) => {
		const data = task ? [...finishedList, task] : [...finishedList];

		finishedList = data;
	};

	const handlerDelete = (idx) => {
		toDoList.forEach((task) => {
			if (task.idx === idx) {
				toDoList = toDoList.filter(item => item !== task)
				console.log(toDoList);
				updateToDo();
				taskNames.delete(task.name)
				console.log(task);
			}
		});

		finishedList.forEach((task) => {
			if (task.idx === idx) {
				finishedList = finishedList.filter(item => item !== task)
				updateFinished();
				console.log(task);
			}
		});

		updateToDo();
	};

	const handlerFinish = (idx) => {
		toDoList.forEach((task) => {
			if (task.idx === idx) {
				handlerDelete(idx);
				updateToDo();

				finishedList.push(task);
				updateFinished();
			}
		});
	};

	const handlerFinishBack = (idx =>{

	});

	const handlerCreate = () => {
		let { value } = document.querySelector(".newTask");

		if (!value) return;

		if (taskNames.has(value)) {
			console.log(`Task "${value}" already exists.`);
			return;
		}

		taskNames.add(value);

		const task = {
			idx: count,
			name: value,
			handlerDelete,
		};

		console.log(value);

		count += 1;
		updateToDo(task);

		value = document.querySelector(".newTask").value = "";
		console.log(toDoList);
	};
</script>

<main>
	<div class="wrapper-create-task">
		<input type="text" class="newTask" placeholder="Write wour task here" />
		<button on:click={handlerCreate}>Create</button>
	</div>
	<div class="wrapper-container-tasks flex flex-justify-around">
		<div class="wrapper-todo">
			<h1>Todo</h1>
			{#each toDoList as { idx, name }}
				<TodoItem
					nameTodo={name}
					{idx}
					{handlerDelete}
					{handlerFinish}
				/>
			{/each}
		</div>
		<div class="wrapper-done">
			<h1>Finished</h1>
			{#each finishedList as { idx, name }}
				<TodoItem
					nameTodo={name}
					{idx}
					{handlerDelete}
					{handlerFinish}
				/>
			{/each}
		</div>
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
