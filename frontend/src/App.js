import logo from './logo.svg';
import './App.css';
import React, { useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";


function App() {
  const [qtdeVariables, setQtdeVariables] = useState('');
  const [variables, setVariables] = useState([]);
  const [objective, setObjective] = useState({});
  var [qtdeConstraints, setQtdeConstraints] = useState('');
  const [constraints, setConstraints] = useState([]);
  const [maximize, setMaximize] = useState(true);
  const [result, setResult] = useState(null);
  const [plot, setPlot] = useState(null);

  const handleQtdeChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {

      const sequencia = Array.from({ length: value }, (_, i) => `x${i + 1}`);
      setQtdeVariables(value);
      setVariables(sequencia); // Inicializa a lista com valores vazios
    } else {
      setQtdeVariables('');
      setVariables([]);
    }
  };

  const handleAddConstraint = () => {
    setQtdeConstraints(qtdeConstraints+1);
    setConstraints([...constraints, { lhs: {}, sense: "<=", rhs: 0, name: "Constraint"+qtdeConstraints }]);
  };

  const handleSolve = async () => {
    try {
      const response = await axios.post("http://localhost:5000/optimize", {
        variables,
        objective,
        constraints,
        maximize,
      });

      setResult(response.data);
      if (response.data.plot) {
        setPlot(`data:image/png;base64,${response.data.plot}`);
      }
    } catch (error) {
      console.error("Error solving the optimization problem", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Otimização Linear</h1>

      <h2>Variáveis de Decisão</h2>
      <p> Quantidade de Variáveis: <input
            type="number"
            onChange={handleQtdeChange}
            placeholder="Digite um número"
          /></p>

      <h2>Função Objetivo</h2>
      <label>
        Maximizar
        <input
          type="radio"
          checked={maximize}
          onChange={() => setMaximize(true)}
        />
      </label>
      <label>
        Minimizar
        <input
          type="radio"
          checked={!maximize}
          onChange={() => setMaximize(false)}
        />
      </label>

      {variables.map((variable) => (
        <div key={variable}>
          <label>{variable}:</label>
          <input
            type="number"
            onChange={(e) =>
              setObjective({ ...objective, [variable]: parseFloat(e.target.value) })
            }
          />
        </div>
      ))}

      <h2>Restrições</h2>
      {constraints.map((constraint, index) => (
        <div key={index}>
          {variables.map((variable) => (
            <div key={variable}>
              <label>{variable}:</label>
              <input
                type="number"
                onChange={(e) => {
                  const newConstraints = [...constraints];
                  newConstraints[index].lhs[variable] = parseFloat(e.target.value);
                  setConstraints(newConstraints);
                }}
              />
            </div>
          ))}

          <label>
            Sentido:
            <select
              value={constraint.sense}
              onChange={(e) => {
                const newConstraints = [...constraints];
                newConstraints[index].sense = e.target.value;
                setConstraints(newConstraints);
              }}
            >
              <option value="<=">&lt;=</option>
              <option value=">=">&gt;=</option>
              <option value="=">=</option>
            </select>
          </label>

          <label>
            Valor:
            <input
              type="number"
              onChange={(e) => {
                const newConstraints = [...constraints];
                newConstraints[index].rhs = parseFloat(e.target.value);
                setConstraints(newConstraints);
              }}
            />
          </label>
        </div>
      ))}
      <button onClick={handleAddConstraint}>Adicionar Restrição</button>

      <h2>Resultados</h2>
      <button onClick={handleSolve}>Resolver</button>
      {result && (
        <div>
          <h3>Status: {result.status}</h3>
          <h3>Valor Ótimo: {result.objective_value}</h3>
          <h3>Variáveis:</h3>
          <ul>
            {Object.entries(result.variables).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plot && (
        <div>
          <h3>Espaço de Soluções</h3>
          <img src={plot} alt="Espaço de Soluções" />
        </div>
      )}
    </div>
  );
}


export default App;

