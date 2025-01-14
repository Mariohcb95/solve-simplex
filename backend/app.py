from flask import Flask, request, jsonify
from flask_cors import CORS
import pulp
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json

    # Monta as variáveis
    objective = data['objective']
    constraints = data['constraints']
    maximize = data['maximize']
    variables = data['variables']

    # cria um LP problem
    prob = pulp.LpProblem("Optimization Problem", pulp.LpMaximize if maximize else pulp.LpMinimize)

    # Define variáveis
    lp_vars = {var: pulp.LpVariable(var, lowBound=0) for var in variables}

    # Adiciona função objetivo
    prob += pulp.lpSum([coeff * lp_vars[var] for var, coeff in objective.items()]), "Objective"

    # Adiciona restrições
    for constr in constraints:
        lhs = pulp.lpSum([coeff * lp_vars[var] for var, coeff in constr['lhs'].items()])
        if constr['sense'] == "<=":
            prob += lhs <= constr['rhs'], constr['name']
        elif constr['sense'] == ">=":
            prob += lhs >= constr['rhs'], constr['name']
        elif constr['sense'] == "=":
            prob += lhs == constr['rhs'], constr['name']

    # resolve o problema
    prob.solve()

    # Prepara os resultados
    result = {
        'status': pulp.LpStatus[prob.status],
        'objective_value': pulp.value(prob.objective),
        'variables': {var: lp_vars[var].varValue for var in lp_vars}
    }

    # Se tiver 2 variáveis, gerar gráfico
    if len(variables) == 2:
        fig, ax = plt.subplots()

        # Plota restrições
        x = [i for i in range(-10, 20)]
        for constr in constraints:
            if len(constr['lhs']) == 2:
                coeffs = list(constr['lhs'].values())
                rhs = constr['rhs']
                sense = constr['sense']

                y = [(rhs - coeffs[0] * xi) / coeffs[1] if coeffs[1] != 0 else float('inf') for xi in x]
                ax.plot(x, y, label=constr['name'])

        x_sol, y_sol = result['variables'][variables[0]], result['variables'][variables[1]]
        ax.plot(x_sol, y_sol, 'ro', label='Solução Ótima')

        ax.legend()
        plt.xlabel(variables[0])
        plt.ylabel(variables[1])
        plt.title('Espaço de Soluções')
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()

        result['plot'] = img_str

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
